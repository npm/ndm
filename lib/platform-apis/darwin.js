// API for OSX launchctl.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Darwin(opts) {
  _.extend(this, {
    platform: 'darwin',
    template: path.resolve(__dirname, '../../templates/launchctl.ejs'),
    utils: require('../utils')
  }, opts);
}

util.inherits(Darwin, PlatformBase);

// override default config variables.
Darwin.configOverrides = {
  osLogsDirectory: path.resolve(process.env['HOME'], './Library/Logs/'),
  daemonsDirectory: '~/Library/LaunchAgents/',
  daemonExtension: '.plist'
}

// override os.platform().
Darwin.isPlatform = function() { return false; };

module.exports = Darwin;
