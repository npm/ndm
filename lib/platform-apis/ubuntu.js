// API for Ubuntu Upstart 1.4.0.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Ubuntu(opts) {
  _.extend(this, {
    platform: 'ubuntu',
    utils: require('../utils'),
    template: path.resolve(__dirname, '../../templates/upstart-ubuntu.ejs')
  }, opts);
}

util.inherits(Ubuntu, PlatformBase);

// override default config variables.
Ubuntu.configOverrides = {
  osLogsDirectory: '/var/log',
  daemonsDirectory: '/etc/init',
  sudo: true,
  uid: 'ubuntu',
  daemonExtension: '.conf'
}

// override os.platform().
Ubuntu.isPlatform = function() { return false; };

module.exports = Ubuntu;
