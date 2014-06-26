var _ = require('lodash'),
  cli = null,
  S = require('string'),
  Config = require('./config'),
  config = Config(),
  Installer = require('./installer');

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function Cli(opts) {
  _.extend(this, {
    logger: require('./logger'),
    service: require('./service'),
    yargs: require('yargs'), // overridable parsed arguments.
    takenFlags: [],
    commands: {
      'init': "ndm init\tcreate the ndm service.json.",
      'generate': "ndm generate\tgenerate OS-specific daemon wrappers.",
      'update': "ndm update\tupdate service.json with new services.",
      'start': "ndm start [<service]\tstart all, or a specific service.",
      'stop': "ndm stop [<service>]\tstop all, or a specific service.",
      'restart': "ndm restart[<service]\trestart all, or a specific service.",
      'list': "ndm list\tlist all services availble in service.json"
    }
  }, opts);
};

// actually run the cli, the cli is also
// included and used for logging.
Cli.prototype.run = function() {
  var _this = this;

  this.generateArgs();

  if (this.yargs.argv._.length === 0 || this.yargs.argv.help) {
    this.logger.log(this.yargs.help());
  } else if (!this.commands[this.yargs.argv._[0]]){
    this.logger.error('command ' + this.yargs.argv._[0] + ' not found')
    this.logger.log(this.yargs.help());
  } else {
    this.updateConfigWithArgs(); // update config singleton.

    try { // execute the command, passing along args.
      this[this.yargs.argv._[0]].apply(this, this.yargs.argv._.slice(1));
    } catch (e) {
      this.logger.error(e.message);
    }
  }
};

// updates the configuration singleton
// with any CLI args passed in.
Cli.prototype.updateConfigWithArgs = function() {
  var yargs = this.yargs;

  _.keys(config).forEach(function(key) {
    if (yargs.argv[key]) {
      config[key] = yargs.argv[key];
    }
  });

  // write the changes.
  Config(config);
};

// generate kwargs CLI parser from config.
Cli.prototype.generateArgs = function() {
  var _this = this,
    descriptions = config.descriptions();

  // populate config flags.
  _.forIn(config, function(value, key) {
    if (descriptions[key]) {
      _this.yargs.options(_this._getFlag(key.toLowerCase()), {
        alias: S(key).dasherize().s,
        describe: descriptions[key],
        default: config[key]
      });
    }
  });

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
Cli.prototype.generate = function() {
  var _this = this;

  this.logger.log('generating service wrappers:')

  this.service.allServices().forEach(function(service) {
    service.generateScript();
    _this.logger.warn("  generated " + service.scriptPath());
  });

  this.service.printRunMessage();
};

// start|stop|restart services.
Cli.prototype.start = function(serviceName) {
  this.logger.log('starting services:');
  this._runCommand('start', serviceName);
};

Cli.prototype.stop = function(serviceName) {
  this.logger.log('stopping services:');
  this._runCommand('stop', serviceName);
};

Cli.prototype.restart = function(serviceName) {
  this.logger.log('restarting services');
  this._runCommand('restart', serviceName);
};

Cli.prototype._runCommand = function(command, serviceName) {
  var _this = this;

  this.service.allServices().forEach(function(service) {
    // if we provide a serviceName parameter, only run command
    // on the specific service.
    if (serviceName && service.name !== serviceName) return;

    service.runCommand(command, function(err) {
      if (err) {
        _this.logger.error("could not " + command + " all services. make sure you have run ndm-generate")
      } else {
        _this.logger.warn("  " + command + " " + service.scriptPath());
      }
    });
  });
}

// list all available services.
Cli.prototype.list = function() {
  var _this = this;

  this.service.allServices().forEach(function(service) {
    _this.logger.log(service.name + ":\t" + service.description);
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
