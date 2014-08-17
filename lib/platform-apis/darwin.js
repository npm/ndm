// API for OSX launchctl.
var _ = require('lodash'),
  path = require('path'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util');

function Darwin(opts) {
  _.extend(this, {
    template: path.resolve(__dirname, '../templates/launchctl.ejs'),
    utils: require('../utils')
  }, opts);
}

util.inherits(Darwin, PlatformBase);

Darwin.configOverrides = {
  osLogsDirectory: path.resolve(process.env['HOME'], './Library/Logs/'),
  daemonsDirectory: '~/Library/LaunchAgents/',
  daemonExtension: '.plist',
  template: path.resolve(
    __dirname, '../../templates/launchctl.ejs'
  )
}

module.exports = Darwin;
