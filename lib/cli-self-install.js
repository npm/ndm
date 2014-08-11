// CLI for creating self installing services.
var _ = require('lodash'),
  async = require('async'),
  cli = null,
  CliBase = require('./cli-base').CliBase,
  Config = require('./config'),
  config = Config(),
  Service = require('./service'),
  Installer = require('./installer'),
  path = require('path'),
  S = require('string'),
  temp = require('temp'),
  util = require('util'),
  utils = require('./utils');

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function CliSelfInstall(opts) {
  _.extend(this, {
    logger: require('./logger'),
    Interview: require('./interview'),
    service: Service,
    rimraf: require('rimraf'),
    yargs: require('yargs'), // overridable parsed arguments.
    filter: null // what service are we self installing?
  }, opts);

  // for commands like run-script, update service filter.
  config.filter = this.filter;
  Config(config);
};

util.inherits(CliSelfInstall, CliBase);

CliSelfInstall.prototype.listScripts = function() {
  CliBase.prototype['list-scripts'].call(this, this.filter);
};

CliSelfInstall.prototype.runScript = function() {
  CliBase.prototype['run-script'].call(this, argv._[0]);
};

CliSelfInstall.prototype.remove = function() {
  CliBase.prototype.remove.call(this, this.filter);
};

CliSelfInstall.prototype.install = function() {
  CliBase.prototype.install.call(this, this.filter);
};

CliSelfInstall.prototype._runCommand = function(command, serviceName, cb) {
  CliBase.prototype._runCommand.call(this, command, this.filter, cb);
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
