var _ = require('lodash'),
  S = require('string'),
  path = require('path'),
  config = null;

function Config(opts) {
  _.extend(this, {
    serviceJson: path.resolve('./service.json'),
    platform: process.platform,
    env: process.env,
    baseWorkingDirectory: path.resolve('.')
  }, opts);

  // allow platform and env to be overridden before applying.
  _.extend(this, this._getEnv(), this._getOSDefaults(), opts);
};

// os specific config variables.
Config.prototype._getOSDefaults = function(platform) {
  var defaults = {
    darwin: {
      daemonsDirectory: '~/Library/LaunchAgents/',
      daemonExtension: '.plist',
      nodeBin: '/usr/local/bin/node',
      npmBin: '/usr/local/bin/npm',
      template: path.resolve(
        __dirname, '../templates/launchctl.ejs'
      )
    }
  }

  // default to Ubuntu specific settings.
  return defaults[this.platform] || {
    daemonsDirectory: '/etc/init',
    nodeBin: '/usr/bin/node',
    npmBin: '/usr/bin/npm',
    daemonExtension: '.conf',
    template: path.resolve(
      __dirname, '../templates/upstart-ubuntu.ejs'
    )
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
