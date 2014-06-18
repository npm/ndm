var _ = require('lodash'),
  S = require('string'),
  path = require('path'),
  config = null,
  clc = require('cli-color'),
  fs = require('fs');

function Config(opts) {
  _.extend(this, {
    serviceJson: path.resolve('./service.json'),
    env: process.env,
    baseWorkingDirectory: path.resolve('.'),
    releaseInfoFile: '/etc/redhat-release'
  }, opts);

  // allow platform to be overridden.
  this.platform = this.os();

  // allow platform and env to be overridden before applying.
  _.extend(this, this._getEnv(), this._getOSDefaults(), opts);
};

// os specific config variables.
Config.prototype._getOSDefaults = function() {
  var defaults = {
    darwin: {
      daemonsDirectory: '~/Library/LaunchAgents/',
      daemonExtension: '.plist',
      nodeBin: '/usr/local/bin/node',
      template: path.resolve(
        __dirname, '../templates/launchctl.ejs'
      )
    },
    centos: {
      nodeBin: '/usr/local/bin/node',
      daemonsDirectory: '/etc/init',
      daemonExtension: '.conf',
      template: path.resolve(
        __dirname, '../templates/upstart-centos.ejs'
      )
    }
  }

  // default to Ubuntu specific settings.
  return defaults[this.platform] || {
    daemonsDirectory: '/etc/init',
    nodeBin: '/usr/bin/node',
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
};

Config.prototype.os = function() {
  if (this.platform) return this.platform;

  else if (fs.existsSync(this.releaseInfoFile)) {
    var releaseVersion = fs.readFileSync(this.releaseInfoFile).toString();
    if (releaseVersion.match(/CentOS/)) return 'centos';
  }

  return process.platform;
};

module.exports = function(opts) {
  if (!opts && config) return config;
  else {
    config = new Config(opts);
    return config;
  }
};
