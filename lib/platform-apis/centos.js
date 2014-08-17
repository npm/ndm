// API for Centos Upstart 0.6.
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Darwin(opts) {
  _.extend(this, {
    platform: 'centos',
    template: path.resolve(__dirname, '../../templates/upstart-centos.ejs'),
    utils: require('../utils')
  }, opts);
}

util.inherits(Darwin, PlatformBase);

// override default config variables.
Darwin.configOverrides = {
  osLogsDirectory: '/var/log',
  daemonsDirectory: '/etc/init',
  daemonExtension: '.conf',
  sudo: false
}

// Use /etc/redhat-release to determine if platform is Centos.
Darwin.isPlatform = function() {
  var releaseInfoFile = '/etc/redhat-release';
  if (!fs.existsSync(releaseInfoFile)) return false;
  else return fs.readFileSync(releaseInfoFile, 'utf-8').match(/CentOS/);
}

module.exports = Darwin;
