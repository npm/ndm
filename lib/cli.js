var _ = require('lodash'),
  async = require('async'),
  cli = null,
  Config = require('./config'),
  config = Config(),
  Service = require('./service'),
  Installer = require('./installer'),
  S = require('string'),
  temp = require('temp');

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function Cli(opts) {
  _.extend(this, {
    logger: require('./logger'),
    Interview: require('./interview'),
    service: Service,
    rimraf: require('rimraf'),
    yargs: require('yargs'), // overridable parsed arguments.
    takenFlags: [],
    commands: {
      'install': "ndm install\task user about environment variables and install service.",
      'init': "ndm init\tcreate the ndm service.json.",
      'generate': "ndm generate\tgenerate OS-specific daemon wrappers.",
      'remove': "ndm remove\tremove OS-specific daemon wrappers.",
      'update': "ndm update\tupdate service.json with new services.",
      'start': "ndm start [<service]\tstart all, or a specific service.",
      'stop': "ndm stop [<service>]\tstop all, or a specific service.",
      'restart': "ndm restart[<service]\trestart all, or a specific service.",
      'list': "ndm list\tlist all services availble in service.json",
      'interview': "ndm interview\task the user to fill in missing fields in service.json",
      'run-script': "ndm run-script [<script-name>][<service>]\trun script with env and args from service.json",
      'list-scripts': "ndm list-scripts\tlist all the scripts provided by ndm services"
    }
  }, opts);
};

// actually run the cli, the cli is also
// included and used for logging.
Cli.prototype.run = function() {
  var _this = this,
    argv = null;

  this.generateArgs();

  argv = this.yargs.argv;

  if (argv._.length === 0 || argv.help) {
    this.logger.log(this.yargs.help());
  } else if (!this.commands[argv._[0]]){
    this.logger.error('command ' + argv._[0] + ' not found')
    this.logger.log(this.yargs.help());
  } else {
    // make the aliases actually work.
    argv = this.yargs.normalize().argv;

    this.updateConfigWithArgs(argv); // update config singleton.

    try { // execute the command, passing along args.
      this[argv._[0]].apply(this, argv._.slice(1));
    } catch (e) {
      this.logger.error(e.message);
    }
  }
};

// updates the configuration singleton
// with any CLI args passed in.
Cli.prototype.updateConfigWithArgs = function(argv) {
  _.keys(config).forEach(function(key) {
    if (argv[key]) {
      config[key] = argv[key];
    }
  });

  // write the changes.
  Config(config);
};

// generate kwargs CLI parser from config.
Cli.prototype.generateArgs = function() {
  var _this = this,
    descriptions = config.descriptions(),
    options = {};

  // populate config flags.
  _.forIn(config, function(value, key) {
    if (descriptions[key]) {
      options[_this._getFlag(key.toLowerCase())] = {
        alias: S(key).dasherize().s,
        describe: descriptions[key],
        default: config[key]
      };
    }
  });

  _this.yargs.options(options);

  // now add the usage info.
  this.generateUsage();
};

Cli.prototype.generateUsage = function() {
  var usage = 'Deploy service daemons directly from npm packages\n\nUsage:\n';

  _.forIn(this.commands, function(value, key) {
    usage += "\n" + value;
  });

  this.yargs.usage(usage);
};

// iterate over the key, and find a flag
// that hasn't yet been used.
Cli.prototype._getFlag = function(candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var char = candidates.charAt(i);
    if (this.takenFlags.indexOf(char) === -1) {
      this.takenFlags.push(char);
      return char;
    }
  }
};

// initialize ndm directory.
Cli.prototype.init = function() {
  this.logger.log("setting up ndm directory:");
  (new Installer()).init();
};

// update service.json with new
// services in package.json.
Cli.prototype.update = function() {
  this.logger.log("updating service.json:");
  (new Installer()).update();
};

// generate service-daemons from
// service.json
Cli.prototype.generate = function(serviceName) {
  var _this = this;

  this.logger.log('generating service wrappers:')

  this.service.allServices(serviceName).forEach(function(service) {
    service.generateScript();
    _this.logger.warn("  generated " + service.scriptPath());
  });

  this.service.printRunMessage();
};

// remove service-daemons
Cli.prototype.remove = function(serviceName) {
  var _this = this;

  // stop services before removing their wrappers.
  this.stop(serviceName, function() {
    // now remove the wrapper for each service.
    _this.service.allServices(serviceName).forEach(function(service) {
      service.removeScript();
      _this.logger.warn("  removed " + service.scriptPath());
    });
  });
};

// start|stop|restart services.
Cli.prototype.start = function(serviceName, cb) {
  this.logger.log('starting services:');
  this._runCommand('start', serviceName, cb);
};

Cli.prototype.stop = function(serviceName, cb) {
  this.logger.log('stopping services:');
  this._runCommand('stop', serviceName, cb);
};

Cli.prototype.restart = function(serviceName, cb) {
  this.logger.log('restarting services');
  this._runCommand('restart', serviceName, cb);
};

Cli.prototype._runCommand = function(command, serviceName, cb) {
  var _this = this;

  async.each(this.service.allServices(serviceName), function(service, done) {
    service.runCommand(command, function(err) {
      _this.logger.warn("  " + command + " " + service.scriptPath());
      done();
    });
  }, cb);
};

// run a script from package.json's scripts block, in the
// context of service.json's args and envs.
Cli.prototype['run-script'] = function(scriptName) {
  var _this = this,
    filter = Config().filter,
    scriptsExecuted = 0;

  scriptsExecuted = _.filter(this.service.allServices(filter), function(service) {
    if (!service.hasScript(scriptName)) return false;

    service.runScript(scriptName, function(err) {
      if (err) _this.logger.error(err);
    });

    return true;
  }).length;

  if (!scriptsExecuted) this['list-scripts']();
};

// list all available services.
Cli.prototype.list = function(serviceName) {
  var _this = this;

  this.service.allServices(serviceName).forEach(function(service) {
    _this.logger.log(service.name + ":\t" + service.description);
  });
};

// list all available scripts.
Cli.prototype['list-scripts'] = function(serviceName) {
  var _this = this;

  this.service.allServices(serviceName).forEach(function(service) {
    _this.logger.log(service.name + ':\t' + service.description);
    service.listScripts();
  });
};

// interactive Q/A session with service.json.
Cli.prototype.interview = function(serviceName) {
  var interview = new this.Interview(
    serviceJsonPath = Service._serviceJsonPath(serviceName)
  );
  interview.run(function() {});
};

// Ask a user questions about the service they're
// installing, and install it.
Cli.prototype.install = function(serviceName) {
  var _this = this,
    tmpServiceJsonPath = temp.path({suffix: '.json'}),
    srcServiceJsonPath = Service._serviceJsonPath(serviceName),
    interview = new this.Interview({
      serviceJsonPath: srcServiceJsonPath,
      tmpServiceJsonPath: tmpServiceJsonPath
    });

  interview.run(function() {
    _this.generate(serviceName); // generate the service wrappers.
    _this.rimraf.sync(tmpServiceJsonPath); // remove the temporary service.json.
  });
};

// export CLI as a singleton, to that
// it can easily be imported for logging.
module.exports = function(opts) {
  if (!opts && cli) return cli;
  else {
    cli = new Cli(opts);
    return cli;
  }
};
