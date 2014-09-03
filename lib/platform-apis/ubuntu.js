// API for Ubuntu Upstart 1.4.0.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Ubuntu(opts) {
  _.extend(this, {
    platform: 'ubuntu',
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
  gid: 'ubuntu',
  daemonExtension: '.conf'
}

Ubuntu.prototype.start = function(service, cb) {
  service.execCommand('service ' + service.name + ' start', cb);
};

Ubuntu.prototype.stop = function(service, cb) {
  service.execCommand('service ' + service.name + ' stop', cb);
};

Ubuntu.prototype.restart = function(service, cb) {
  service.execCommand('service ' + service.name + ' restart', cb);
};

module.exports = Ubuntu;
