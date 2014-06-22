var _ = require('lodash'),
  clc = require('cli-color'),
  cli = null;

function Cli(opts) {
  _.extend(this,
    {},
    require('./config')(),
    opts
  );
}

exports.prototype.error = function() {

};

exports.prototype.info = function() {

};

exports.prototype.log = function() {

};

module.exports = function(opts) {
  if (!opts && cli) return config;
  else {
    cli = new Cli(opts);
    return config;
  }
};
