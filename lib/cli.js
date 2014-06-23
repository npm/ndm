var _ = require('lodash'),
  clc = require('cli-color'),
  cli = null,
  S = require('string'),
  Config = require('./config'),
  config = Config(),
  Installer = require('../lib').Installer,
  Service = require('../lib').Service;

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function Cli(opts) {
  _.extend(this, {
    yargs: require('yargs'),
    takenFlags: [],
    commands: {
      'init': "ndm init\tcreate the ndm service.json.",
      'generate': "ndm generate\tgenerate OS-specific daemon wrappers.",
      'update': "ndm update\tupdate service.json with new services.",
      'start': "ndm start [<service]\tstart all, or a specific service.",
      'stop': "ndm stop [<service>]\tstop all, or a specific service.",
      'restart': "ndm restart[<service]\trestart all, or a specific service."
    }
  }, opts);
};

// actually run the cli, the cli is also
// included and used for logging.
Cli.prototype.run = function() {
  this.generateArgs();

  if (this.yargs.argv._.length === 0 || this.yargs.argv.help) {
    console.log(this.yargs.help());
  } else if (!this.commands[this.yargs.argv._[0]]){
    console.log('command ' + this.yargs.argv._[0] + ' not found');
    console.log(this.yargs.help());
  } else {
    this.updateConfigWithArgs(); // update config singleton.

    try { // execute the command, passing along args.
      this[this.yargs.argv._[0]].apply(this, this.yargs.argv._.slice(1));
    } catch (e) {
      console.log(e.message);
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
  console.log("initializing ndm directory:\n");
  (new Installer()).init();
  printInitMessage();
};

// update service.json with new
// services in package.json.
Cli.prototype.update = function() {
  console.log("updating service.json:\n");
  (new Installer()).update();
  printInitMessage();
};

// generate service-daemons from
// service.json
Cli.prototype.generate = function() {
  console.log('generating service wrappers:')
  Service.allServices().forEach(function(service) {
    service.generateScript();
    console.log(clc.yellow("  generated " + service.scriptPath()));
  });
  printRunMessage();
};

// start|stop|restart services.
Cli.prototype.start = function(service) {
  console.log('starting all services');
  this._runCommand('start');
};

Cli.prototype.stop = function(service) {
  console.log(service);
  console.log('stopping all services');
  this._runCommand('stop');
};

Cli.prototype.restart = function(service) {
  console.log('restarting all services');
  this._runCommand('restart');
};

Cli.prototype._runCommand = function(command, service) {
  Service.allServices().forEach(function(service) {
    service.runCommand(command, function(err) {
      if (err) {
        console.log(clc.red("could not " + command + " all services. make sure you have run " + clc.green("ndm-generate")))
      } else {
        console.log(clc.yellow("  " + command + " " + service.scriptPath()));
      }
    });
  });
}

// pretty console output.
Cli.prototype.log = function() {

};

Cli.prototype.warn = function() {

};

Cli.prototype.error = function() {

};

Cli.prototype.success = function() {

}

// export CLI as a singleton, to that
// it can easily be imported for logging.
module.exports = function(opts) {
  if (!opts && cli) return cli;
  else {
    cli = new Cli(opts);
    return cli;
  }
};

function printRunMessage() {
  console.log("\nto start a all services run:\n  " + clc.green("ndm start"));
  console.log("or manually start the service using " + clc.green("launchctl") + ", " + clc.green("initctl") + ", or " + clc.green("upstart\n"));
  console.log(clc.green('success!'));
};

function printInitMessage() {
  console.log("\nedit " + clc.green("service.json") + " to setup your application's environment.");
  console.log("when you're ready, run " + clc.green('ndm generate') + " to generate service wrappers.");
  console.log("add dependencies to " + clc.green("package.json") + " and run " + clc.green('ndm update') + " to add additional services.\n");
  console.log(clc.green('success!'));
};
