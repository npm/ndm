// API for Ubuntu Upstart 1.4.0.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Ubuntu(opts) {
  _.extend(this, {
    utils: require('../utils'),
    template: path.resolve(__dirname, '../templates/upstart-ubuntu.ejs')
  }, opts);
}

Ubuntu.configOverrides = {
  osLogsDirectory: '/var/log',
  daemonsDirectory: '/etc/init',
  sudo: true,
  uid: 'ubuntu',
  daemonExtension: '.conf',
  template: path.resolve(
    __dirname, '../../templates/upstart-ubuntu.ejs'
  )
}

util.inherits(Ubuntu, PlatformBase);

module.exports = Ubuntu;
