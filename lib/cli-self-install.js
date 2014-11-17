// CLI for creating self installing services.
var _ = require('lodash'),
  async = require('async'),
  cli = null,
  CliBase = require('./cli-base').CliBase,
  config = require('./config')(),
  Service = require('./service'),
  Installer = require('./installer'),
  path = require('path'),
  npmconf = require('npmconf'),
  S = require('string'),
  temp = require('temp'),
  util = require('util'),
  utils = require('./utils'),
  yargs = require('yargs');

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function CliSelfInstall(opts) {
  _.extend(this, {
    logger: require('./logger'),
    Interview: require('./interview'),
    service: Service,
    rimraf: require('rimraf'),
    argv: yargs.normalize().argv,
    filter: null, // what service are we self installing?
  }, opts);

  // for commands like run-script, update service filter.
  config.filter = this.filter;
  config.appName = this.appName;

  this.updateConfigWithArgs(this.argv); // update config singleton with args.
};

util.inherits(CliSelfInstall, CliBase);

CliSelfInstall.prototype.listScripts = function() {
  var _this = this;

  this._ensureNpmConf(function() {
    CliBase.prototype['list-scripts'].call(_this, _this.filter);
  });
};

CliSelfInstall.prototype.runScript = function() {
  var _this = this;

  this._ensureNpmConf(function() {
    CliBase.prototype['run-script'].call(_this, _this.argv._[1]);
  });
};

CliSelfInstall.prototype.remove = function() {
  var _this = this;

  this._ensureNpmConf(function() {
    CliBase.prototype.remove.call(_this, _this.filter);
  });
};

CliSelfInstall.prototype.install = function() {
  var _this = this;

  this._ensureNpmConf(function() {
    CliBase.prototype.install.call(_this, _this.filter);
  });
};

CliSelfInstall.prototype._runCommand = function(command, serviceName, cb) {
  var _this = this;

  this._ensureNpmConf(function() {
    CliBase.prototype._runCommand.call(_this, command, _this.filter, cb);
  });
};

CliSelfInstall.prototype._ensureNpmConf = function(cb) {
  var _this = this;

  npmconf.load(function (er, conf) {
    _this.updateConfigWithNpmconf(conf);
    return cb();
  });
};

// export CLI as a singleton, to that
// it can easily be imported for logging.
module.exports = function(opts) {
  if (!opts && cli) return cli;
  else {
    cli = new CliSelfInstall(opts);
    return cli;
  }
};
