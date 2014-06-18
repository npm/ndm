#!/usr/bin/env node

var config = require('../lib').Config(),
  clc = require('cli-color'),
  yargs = require('yargs')
  .usage('Deploy service wrappers directly from npm packages, for fun and profit')
  .options('s', {
    alias: 'service-json',
    describe: 'path to the JSON file that describes your services',
    default: config.serviceJson
  }),
  Installer = require('../lib').Installer,
  Service = require('../lib').Service;

if (yargs.argv.help) {
  console.log(yargs.help());
} else {
  // update config with keys here.
//  try {
    switch(yargs.argv._[0]) {
    case 'init': // initialize a new ndm directory.
        (new Installer()).init();
        break;
      case 'generate': // generate the ndm service wrappers.
        Service.allServices().forEach(function(service) {
          service.generateScript();
        });
        break;
    }
//  } catch (e) { // something bad happened.
  //  console.log(clc.red(e.message));
//  }
}
