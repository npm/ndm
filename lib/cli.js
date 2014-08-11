// the CLI helper used by ndm itself.
var _ = require('lodash'),
  async = require('async'),
  cli = null,
  CliBase = require('./cli-base').CliBase,
  Config = require('./config'),
  config = Config(),
  Service = require('./service'),
  Installer = require('./installer'),
  S = require('string'),
  temp = require('temp'),
  util = require('util');

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

util.inherits(Cli, CliBase);

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

// interactive Q/A session with service.json.
Cli.prototype.interview = function() {
  var interview = new this.Interview();
  interview.run(function() {});
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
