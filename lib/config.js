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
    appName: 'ndm',
    serviceJsonPath: path.resolve(process.cwd(), 'service.json'),
    logsDirectory: path.resolve(process.cwd(), './logs'),
    env: process.env,
    uid: undefined,
    sudo: false,
    headless: false,
    filter: null,
    prefix: '',
    global: null,
    nodeBin: process.execPath,
    baseWorkingDirectory: path.resolve(process.cwd()),
    releaseInfoFile: '/etc/redhat-release'
  }, opts);

  // allow platform to be overridden.
  this.platform = this.os();

  // allow platform and env to be overridden before applying.
  _.extend(this, this._getEnv(), this._getOSDefaults(), opts);

  // also override with .ndmrc.
  _.extend(this, rc(this.appName, this));

  // global specific options
  if (this.global) {
    _.extend(this, this._getGlobalOverrides(this.global));
  }
};

// os specific config variables.
Config.prototype._getOSDefaults = function() {
  var defaults = {
    darwin: {
      daemonsDirectory: '~/Library/LaunchAgents/',
      daemonExtension: '.plist',
      template: path.resolve(
        __dirname, '../templates/launchctl.ejs'
      )
    },
    centos: {
      daemonsDirectory: '/etc/init',
      daemonExtension: '.conf',
      sudo: false,
      template: path.resolve(
        __dirname, '../templates/upstart-centos.ejs'
      )
    }
  }

  // default to Ubuntu specific settings.
  return defaults[this.platform] || {
    daemonsDirectory: '/etc/init',
    sudo: true,
    uid: 'ubuntu',
    daemonExtension: '.conf',
    template: path.resolve(
      __dirname, '../templates/upstart-ubuntu.ejs'
    )
  }
};

// return a set of descriptions for the various
// command-line options. Any commands with descriptions
// will automatically become available to the CLI.
Config.prototype.descriptions = function() {
  return {
    serviceJsonPath: 'path to service.json file',
    sudo: 'should start|stop|restart command be run as super user?',
    baseWorkingDirectory: 'where should ndm look for services?',
    releaseInfoFile: 'os-specific file that provides information about platform',
    logsDirectory: 'where should service logs be generated?',
    daemonsDirectory: 'where should the generated service daemons be stored?',
    nodeBin: 'where does the node executable reside?',
    uid: 'what user should scripts be executed as?',
    platform: 'what OS platform is ndm being run on?',
    filter: 'only execute run-script on the service name provided',
    global: 'use a globally installed npm package as a service',
    prefix: 'npm prefix used to locate globally installed npm packages'
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

// global specific options
Config.prototype._getGlobalOverrides = function(global) {
  var pkgPath = this.prefix + '/lib/node_modules/' + global;

  var opts = {
    baseWorkingDirectory: pkgPath,
    serviceJsonPath: path.resolve(pkgPath, './service.json'),
    logsDirectory: path.resolve(pkgPath, './logs')
  }

  return opts;
};

// detect the os that ndm is being run on.
Config.prototype.os = function() {
  if (this.platform) return this.platform;

  else if (fs.existsSync(this.releaseInfoFile)) {
    var releaseVersion = fs.readFileSync(this.releaseInfoFile).toString();
    if (releaseVersion.match(/CentOS/)) return 'centos';
  }

  return process.platform;
};

// singleton pattern for grabbing config model.
module.exports = function(opts) {
  if (!opts && config) return config;
  else {
    config = new Config(opts);
    return config;
  }
};
