// API for Centos Upstart 0.6.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Darwin(opts) {
  _.extend(this, {
    template: path.resolve(__dirname, '../templates/upstart-centos.ejs'),
    utils: require('../utils')
  }, opts);
}

util.inherits(Darwin, PlatformBase);

Darwin.configOverrides = {
  osLogsDirectory: '/var/log',
  daemonsDirectory: '/etc/init',
  daemonExtension: '.conf',
  sudo: false,
  template: path.resolve(
    __dirname, '../../templates/upstart-centos.ejs'
  )
}

module.exports = Darwin;
