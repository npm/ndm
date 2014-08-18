// API for OSX launchctl.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Darwin(opts) {
  _.extend(this, {
    platform: 'darwin',
    template: path.resolve(__dirname, '../../templates/launchctl.ejs')
  }, opts);
}

util.inherits(Darwin, PlatformBase);

// override default config variables.
Darwin.configOverrides = {
  osLogsDirectory: path.resolve(process.env['HOME'], './Library/Logs/'),
  daemonsDirectory: '~/Library/LaunchAgents/',
  daemonExtension: '.plist'
}

Darwin.prototype.start = function(service, cb) {
  service.execCommand('launchctl load ' + service.scriptPath(), cb);
};

Darwin.prototype.stop = function(service, cb) {
  service.execCommand('launchctl unload ' + service.scriptPath(), cb);
};

Darwin.prototype.restart = function(service, cb) {
  service.execCommand('launchctl unload ' + service.scriptPath() + ';launchctl load ' + service.scriptPath(), cb);
};

module.exports = Darwin;
