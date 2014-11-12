var _ = require('lodash'),
  S = require('string'),
  path = require('path'),
  config = null,
  fs = require('fs'),
  rc = require('rc');

// handles loading and detecting configuration
// pulling together OS-specific variables,
// ENV, and args.
function Config(opts) {
  _.extend(this, {
    appName: 'ndm', // used by rc.
    serviceJsonPath: path.resolve(process.cwd(), 'service.json'),
    tmpServiceJsonPath: null, // used during install phase.
    logsDirectory: this.defaultLogsDirectory(),
    env: process.env,
    uid: null,
    gid: null,
    console: null, // In upstart 1.4, where should logs be sent? <logged|output|owner|none>
    sudo: false,
    headless: false,
    filter: null,
    modulePrefix: '',
    nodeBin: process.execPath,
    baseWorkingDirectory: path.resolve(process.cwd()),
    globalPackage: false,
    platform: null, // override the platform ndm generates services for
    platformApis: {
      ubuntu: require('./platform-apis/ubuntu'),
      centos: require('./platform-apis/centos'),
      darwin: require('./platform-apis/darwin'),
      initd: require('./platform-apis/init-d')
    },
    parsers: {
      sudo: function(v) { return v.toString() === 'true' },
      headless: function(v) { return v.toString() === 'true' },
      globalPackage: function(v) { return v.toString() === 'true' }
    }
  }, opts);

  // allow platform to be overridden.
  this.platform = this.os();

  // allow platform and env to be overridden before applying.
  _.extend(this, this._getEnv(), this._getOSDefaults(), opts);

  this._rcOverride();
};

// called after loading configuration to update
// config class with defaults for the type of
// os-specific service being generated.
Config.prototype.updateWithOSDefaults = function() {
  _.extend(this, this._getOSDefaults(), this);
}

// override with settings in .ndmrc.
Config.prototype._rcOverride = function() {
  var ndmrc = rc(this.appName, {}),
    _this = this;

  Object.keys(ndmrc).forEach(function(key) {
    if (typeof _this[key] !== 'function') {
      _this[key] = _this.parsers[key] ? _this.parsers[key](ndmrc[key]) : ndmrc[key];
    }
  });
};

// return the default log directory.
Config.prototype.defaultLogsDirectory = function() {
  return path.resolve(process.cwd(), './logs')
};

// os specific config variables.
Config.prototype._getOSDefaults = function() {
  // default to Ubuntu OS settings.
  return (this.platformApis[this.platform] || this.platformApis['ubuntu']).configOverrides;
};

// return a set of descriptions for the various
// command-line options. Any commands with descriptions
// will automatically become available to the CLI.
Config.prototype.descriptions = function() {
  return {
    serviceJsonPath: 'path to service.json file',
    sudo: 'should start|stop|restart command be run as super user?',
    baseWorkingDirectory: 'where should ndm look for services?',
    logsDirectory: 'where should service logs be generated?',
    daemonsDirectory: 'where should the generated service daemons be stored?',
    nodeBin: 'where does the node executable reside?',
    uid: 'what user should scripts be executed as?',
    gid: 'what group should scripts be executed as?',
    console: 'set what to do with process console (see Upstart docs).',
    platform: 'what OS platform is ndm being run on?',
    filter: 'only execute run-script on the service name provided',
    modulePrefix: 'npm prefix used to locate globally installed npm packages'
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

// detect the os that ndm is being run on.
Config.prototype.os = function() {
  var _this = this;

  if (this.platform) return this.platform;
  else {
    Object.keys(this.platformApis).forEach(function(key) {
      var api = new _this.platformApis[key]();
      if (api.isPlatform()) _this.platform = api.platform;
    });

    if (this.platform) return this.platform;
  }

  return process.platform;
};

// singleton pattern for grabbing config model.
module.exports = function(opts, resetConfig) {
  if (!config || resetConfig) config = new Config(opts);
  else if (opts) _.extend(config, opts);

  return config;
};
