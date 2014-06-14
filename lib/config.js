var _ = require('lodash'),
  S = require('string'),
  path = require('path'),
  config = null;

function Config(opts) {
  _.extend(this, {
    platform: process.platform,
    env: process.env,
    baseWorkingDirectory: path.resolve('./node_modules')
  }, opts);

  // allow platform and env to be overridden before applying.
  _.extend(this, this._getEnv(), this._getOSDefaults());
};

// os specific config variables.
Config.prototype._getOSDefaults = function(platform) {
  var defaults = {
    darwin: {
      servicesDirectory: '~/Library/LaunchAgents/'
    }
  }

  // default to Ubuntu specific settings.
  return defaults[this.platform] || {
    servicesDirectory: '/etc/init'
  }
};

// environment variables of the form NDM_.
Config.prototype._getEnv = function() {
  var _this = this,
    opts = {};

  Object.keys(this.env).forEach(function(key) {
    if (key.match(/^NDM_/)) {
      opts[S(key.replace(/^NDM_/, '').toLowerCase()).camelize().s] = _this.env[key];
    }
  });

  return opts;
}

module.exports = function(opts) {
  if (!opts && config) return config;
  else {
    config = new Config(opts);
    return config;
  }
};
