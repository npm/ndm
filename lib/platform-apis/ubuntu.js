// API for Ubuntu Upstart 1.4.0.
var _ = require('lodash'),
  PlatformBase = require('./platform-base').PlatformBase,
  util = require('util'),
  ndmUtils = require('../utils');

function Ubuntu(opts) {
  _.extend(this, {
    template: __dirname, '../templates/upstart-ubuntu.ejs'
  }, opts);
}

util.inherits(Ubuntu, PlatformBase);

module.exports = Ubuntu;
