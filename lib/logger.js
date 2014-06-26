var clc = require('cli-color'),
  config = require('./config')();

exports.log = function(message) {
  if (!config.headless) {
    console.log(message);
  }
};

exports.warn = function(message) {
  this.log(clc.yellow(message));
};

exports.error = function(message) {
  this.log(clc.red(message));
};

exports.success = function(message) {
  this.log(clc.green(message));
};
