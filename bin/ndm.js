#!/usr/bin/env node

var Config = require('../lib').Config,
  config = Config(),
  clc = require('cli-color'),
  _ = require('lodash'),
  yargs = require('yargs')
  .usage('Deploy service wrappers directly from npm packages\n\n'
    + 'Usage: ndm <command>\n\n'
    + 'where command is one of:\n\n'
    + '\tinit: initialize the deployment directory.\n'
    + '\tgenerate: generate service wrappers from service.json.\n')
  .options('s', {
    alias: 'service-json',
    describe: 'path to the JSON file that describes your services',
    default: config.serviceJson
  }),
  Installer = require('../lib').Installer,
  Service = require('../lib').Service;

if (yargs.argv.help || !yargs.argv._.length) {
  console.log(yargs.help());
} else {
  // update configuration singleton with args.
  _.keys(config).forEach(function(key) {
    if (yargs.argv[key]) {
      config[key] = _.isArray(yargs.argv[key]) ? yargs.argv[key][0] : yargs.argv[key];
    }
  });

  config = Config(config);

  try {
    switch(yargs.argv._[0]) {
    case 'init': // initialize a new ndm directory.
        console.log("initializing ndm directory:\n");
        (new Installer()).init();
        config.printInitMessage();
        break;
      case 'generate': // generate the ndm service wrappers.
        console.log('generating service wrappers:')
        Service.allServices().forEach(function(service) {
          service.generateScript();
          console.log(clc.yellow("  generated " + service.scriptPath()));
        });
        config.printRunMessage();
        break;
      default:
        console.log(yargs.help());
        break;
    }
  } catch (e) { // something bad happened.
    console.log("\n" + clc.red(e.message));
  }
}
