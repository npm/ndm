// base class used by ndm itself, and by the
// ndm self-install-api.
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
function CliBase() {}

// updates the configuration singleton
// with any CLI args passed in.
CliBase.prototype.updateConfigWithArgs = function(argv) {
  _.keys(config).forEach(function(key) {
    if (argv[key] && typeof config[key] !== 'function') {
      config[key] = argv[key];
    }
  });

  // write the changes.
  Config(config);
};

// generate kwargs CLI parser from config.
CliBase.prototype.generateArgs = function() {
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

CliBase.prototype.generateUsage = function() {
  var usage = 'Deploy service daemons directly from npm packages\n\nUsage:\n';

  _.forIn(this.commands, function(value, key) {
    usage += "\n" + value;
  });

  this.yargs.usage(usage);
};

// iterate over the key, and find a flag
// that hasn't yet been used.
CliBase.prototype._getFlag = function(candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var char = candidates.charAt(i);
    if (this.takenFlags.indexOf(char) === -1) {
      this.takenFlags.push(char);
      return char;
    }
  }
};

// generate service-daemons from
// service.json
CliBase.prototype.generate = function(serviceName) {
  var _this = this,
    config = require('./config')();

  this.logger.log('generating service wrappers:')

  this.service.allServices(serviceName).forEach(function(service) {
    service.generateScript();
    _this.logger.warn("  generated " + service.scriptPath());
  });

  this.logger.warn('  log path: ' + config.logsDirectory + '/' + config.appName + '.log');

  this.service.printRunMessage();
};

// remove service-daemons
CliBase.prototype.remove = function(serviceName) {
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
CliBase.prototype.start = function(serviceName, cb) {
  this.logger.log('starting services:');
  this._runCommand('start', serviceName, cb);
};

CliBase.prototype.stop = function(serviceName, cb) {
  this.logger.log('stopping services:');
  this._runCommand('stop', serviceName, cb);
};

CliBase.prototype.restart = function(serviceName, cb) {
  this.logger.log('restarting services');
  this._runCommand('restart', serviceName, cb);
};

CliBase.prototype._runCommand = function(command, serviceName, cb) {
  var _this = this;

  async.each(this.service.allServices(serviceName), function(service, done) {
    service.runCommand(command, function(err) {
      _this.logger.warn("  " + command + " " + service.scriptPath());
      done();
    });
  }, cb);
};

// Ask a user questions about the service they're
// installing, and install it.
CliBase.prototype.install = function(serviceName) {
  var _this = this,
    tmpServiceJsonPath = temp.path({suffix: '.json'}),
    srcServiceJsonPath = Service._serviceJsonPath(serviceName),
    interview = new this.Interview({
      serviceJsonPath: srcServiceJsonPath,
      tmpServiceJsonPath: tmpServiceJsonPath
    });

  interview.run(function() {
    config.tmpServiceJsonPath = tmpServiceJsonPath; // point to temporary config.
    Config(config); // write the changes.
    _this.generate(serviceName); // generate the service wrappers.
    _this.rimraf.sync(tmpServiceJsonPath); // remove the temporary service.json.
  });
};

// list all available scripts.
CliBase.prototype['list-scripts'] = function(serviceName) {
  var _this = this;

  this.service.allServices(serviceName).forEach(function(service) {
    _this.logger.log(service.name + ':\t' + service.description);
    service.listScripts();
  });
};

// run a script from package.json's scripts block, in the
// context of service.json's args and envs.
CliBase.prototype['run-script'] = function(scriptName) {
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

exports.CliBase = CliBase;
