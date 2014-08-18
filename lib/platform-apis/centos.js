// API for Centos Upstart 0.6.
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Centos(opts) {
  _.extend(this, {
    platform: 'centos',
    releaseInfoFile: '/etc/redhat-release',
    template: path.resolve(__dirname, '../../templates/upstart-centos.ejs')
  }, opts);
}

util.inherits(Centos, PlatformBase);

// override default config variables.
Centos.configOverrides = {
  osLogsDirectory: '/var/log',
  daemonsDirectory: '/etc/init',
  daemonExtension: '.conf',
  sudo: false
}

// Use /etc/redhat-release to determine if platform is Centos.
Centos.prototype.isPlatform = function() {
  if (!fs.existsSync(this.releaseInfoFile)) return false;
  else return !!fs.readFileSync(this.releaseInfoFile, 'utf-8').match(/CentOS/);
};

Centos.prototype.start = function(service, cb) {
  service.execCommand('initctl start ' + service.name, cb);
};

Centos.prototype.stop = function(service, cb) {
  service.execCommand('initctl stop ' + service.name, cb);
};

Centos.prototype.restart = function(service, cb) {
  service.execCommand('initctl restart ' + service.name, cb);
};

module.exports = Centos;
