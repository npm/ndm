// CLI for creating self installing services.
var _ = require('lodash'),
  async = require('async'),
  cli = null,
  CliBase = require('./cli-base').CliBase,
  config = require('./config')(),
  Service = require('./service'),
  Installer = require('./installer'),
  npmconf = require('npmconf'),
  path = require('path'),
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
    CliBase: CliBase,
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
  config.updateWithOSDefaults();
};

util.inherits(CliSelfInstall, CliBase);

CliSelfInstall.prototype.listScripts = function(cb) {
  var _this = this,
    cb = cb || function() {};

  this._ensureNpmConf(function() {
    _this['list-scripts'](_this.filter);
    return cb();
  });
};

CliSelfInstall.prototype.runScript = function(cb) {
  var _this = this,
    cb = cb || function() {};

  this._ensureNpmConf(function() {
    _this['run-script'](_this.argv._[1]);
    return cb();
  });
};

CliSelfInstall.prototype.remove = function(cb) {
  var _this = this,
    cb = cb || function() {};

  this._ensureNpmConf(function() {
    _this.CliBase.prototype.remove.call(_this, _this.filter);
    return cb();
  });
};

CliSelfInstall.prototype.install = function(cb) {
  var _this = this,
    cb = cb || function() {};

  this._ensureNpmConf(function() {
    _this.CliBase.prototype.install.call(_this, _this.filter);
    return cb();
  });
};

CliSelfInstall.prototype._runCommand = function(command, serviceName, cb) {
  var _this = this,
    cb = cb || function() {};

  this._ensureNpmConf(function() {
    _this.CliBase.prototype._runCommand.call(_this, command, _this.filter, cb);
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
