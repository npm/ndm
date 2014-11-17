var _ = require('lodash'),
  fs = require('fs'),
  ejs = require('ejs'),
  path = require('path'),
  rimraf = require('rimraf');

// an OS-specific service wrapper for
// a Node.js process.
function Service(opts) {
  _.extend(this,
    {
      description: '',
      utils: require('./utils'),
      logger: require('./logger')
    },
    require('./config')(),
    opts
  );

  // scoped modules contain a '/' (@foo/bar).
  // this causes problems when generating logs/scripts
  // on some platforms.
  this.name = this.name.replace('/', '_');

  // run the script within its ndm
  // node_modules directory.
  this.workingDirectory = this._workingDirectory();

  this.logFile = this.utils.resolve(
    this.logsDirectory,
    this.name + '.log'
  );

  this._copyFieldsFromPackageJson(); // try to grab some sane defaults from package.json.
};

// Determine working directory, if the module itself
// is referenced in service.json, this may be ./ otherwise
// it will be ./node_modules/[module-name].
Service.prototype._workingDirectory = function() {
  var packageJson = this.utils.loadServiceJson(path.resolve(
      this.baseWorkingDirectory,
      './package.json'
    )),
    module = this.module || this.name;

  if (packageJson.name === module) {
    return this.utils.resolve(this.baseWorkingDirectory);
  } else {
    return this.utils.resolve(
      this.baseWorkingDirectory,
      './node_modules',
      this.module
    )
  }
};

// get an instance of the platform-api, based
// on the current configuration settings.
Service.prototype._getPlatformApi = function() {
  var API = this.platformApis[this.platform] || this.platformApis['ubuntu'];
  return new API();
};

// Generate a daemon wrapper from an ejs template.
Service.prototype.generateScript = function(cb) {
  var _this = this;

  if (this.runnable()) {
    // create copy of args, so that we can
    // non-destructively update with args from scipts.start.
    var flatArgs = _.isArray(this.args) ? this.args : this._flattenArgs();

    // add all arguments after -- to generated
    // script as run arguments.
    if (process.argv.indexOf('--') !== -1) {
      process.argv.slice(
        process.argv.indexOf('--') + 1
      ).forEach(function(arg) {
        Array.prototype.push.apply(flatArgs, arg.split('='));
      });
    }

    this._getPlatformApi().generateServiceScript(this, flatArgs, function(err) {
      if (err) _this.logger.error(err.message);
      return cb();
    });
  } else {
    this.logger.warn('  ' + this.name + ' does not have start script.');
    return cb();
  }
};

// Remove the generated daemon wrapper
Service.prototype.removeScript = function(cb) {
  this._getPlatformApi().removeScript(this, function() {
    return cb();
  });
};

// convert args hash to arg list.
Service.prototype._flattenArgs = function() {
  var _this = this,
    flatArgs = [];

  Object.keys(this.args).forEach(function(key) {
    flatArgs.push(key);
    flatArgs.push(_this.args[key]);
  });

  return flatArgs;
};

// replace scripts.start with a standardized
// bin that executes on more platforms.
Service.prototype._startScript = function(runArgs) {
  var startScript = this.scripts.start.replace(/^node +/, ''),
    splitScript = startScript.split(/[ =]/);

  startScript = splitScript.shift();
  runArgs.unshift.apply(runArgs, splitScript);

  return startScript;
};

// is this service runnable? it could just
// provide CLI functionality.
Service.prototype.runnable = function() {
  return this.scripts && this.scripts.start;
};

// where should we save the system daemon to?
// /etc/init.d, ~/Library/LaunchAgents.
Service.prototype.scriptPath = function() {
  return this.utils.resolve(
    this.daemonsDirectory,
    this.name + this.daemonExtension
  );
};

// actually exec a command, optionally as a super user.
Service.prototype.runCommand = function(command, cb) {
  this._getPlatformApi()[command](this, cb);
};

// Helper for executing commands in child processes.
// actually exec a command, optionally as a super user.
Service.prototype.execCommand = function(command, cb) {
  if (this.runnable()) {
    this.utils.exec(
      (this.sudo ? 'sudo ' : '') + command,
      cb
    );
  }
};

// Does the service have a script corresponding
// to the name provided.
Service.prototype.hasScript = function(script) {
  return Object.keys(this.scripts).indexOf(script) > -1;
};

// run a script in the context of environment and argument
// variables described in service.json.
Service.prototype.runScript = function(script, cb) {
  var _this = this,
    cmd = "";

  if (!this.hasScript(script)) return cb();

  // prepend environment variables to command.
  Object.keys(this.env).forEach(function(k) {
    cmd += k + '="' + _this.env[k] + '" ';
  });

  cmd += this.scripts[script];

  // append arguments to command.
  Object.keys(this.args).forEach(function(k) {
    cmd += " " + k + " " + _this._fixPath(_this.args[k]);
  });

  // execute with every argument after run-script <script>.
  process.argv.slice(
    process.argv.indexOf('run-script') + 2
  ).forEach(function(arg) {
    cmd += " " + _this._fixPath(arg);
  });

  this.utils.exec(cmd, this.workingDirectory, cb);
};

// replace characters such as ./ and ~/ with the
// appropriate expansion of the path.
Service.prototype._fixPath = function(arg) {
  arg = arg.replace(/^~\//, process.env['HOME'] + '/');
  arg = arg.replace(/=~\//, '=' + process.env['HOME'] + '/');

  arg = arg.replace(/^.\//, path.resolve('./') + '/');
  arg = arg.replace(/=.\//, '=' + path.resolve('./') + '/');
  return arg;
};

Service.prototype.listScripts = function() {
  var _this = this,
    msg = "";

  Object.keys(this.scripts).forEach(function(name) {
    msg += "  " + name + "\n";
  });

  this.logger.success(msg.replace(/\n$/, ''));
};

// if the service.json has a corresponding package.json
// in script.baseWorkingDirectory, copy any missing fields
// over from the package.json to the service.json.
Service.prototype._copyFieldsFromPackageJson = function() {
  var _this = this,
    fieldsToCopy = ['scripts', 'description'],
    packageJson = null,
    packageJsonPath = path.resolve(path.dirname(this.serviceJsonPath), 'package.json');

  // there is no package.json in the working directory!
  if (!fs.existsSync(packageJsonPath)) return;

  packageJson = this.utils.loadServiceJson(packageJsonPath);

  // we shouldn't copy fields from package.json unless
  // name and this.module match up.
  if (packageJson.name !== this.module) return;

  fieldsToCopy.forEach(function(field) {
    if (!_this[field] && packageJson[field]) _this[field] = packageJson[field];
  });
};

exports.printRunMessage = function() {
  var logger = require('./logger');

  logger.log("\nto start a all services run: '" + require('./config')().appName + " start'");
  logger.log("or manually start the service using 'launchctl', 'initctl', or 'upstart'");
  logger.success("\nsuccess!");
};

// load and return all services.
exports.allServices = function(serviceNameFilter) {
  var config = require('./config')(),
    serviceJson = null,
    serviceJsonPath = exports._serviceJsonPath(serviceNameFilter),
    utils = require('./utils');

  // raise a human readable error if we can't find
  // the service.json file.
  try {
    serviceJson = fs.readFileSync(
      config.tmpServiceJsonPath ? config.tmpServiceJsonPath : utils.resolve(serviceJsonPath)
    ).toString();
  } catch (e) {
    throw Error('could not load ' + serviceJsonPath + ' run ndm init, to create a service.json from your package.json.')
  }

  try {
    serviceJson = JSON.parse(serviceJson);
  } catch (e) {
    throw Error('invalid service.json, check file for errors.');
  }

  if (!config.tmpServiceJsonPath && serviceJsonPath.indexOf('package.json') !== -1) {
    // we are attempting to load a package.json rather than a service.json.
    return parseServiceJson(
      serviceNameFilter,
      exports.transformPackageJson(serviceJson)
    );
  } else {
    // serviceJsonPath points to a service.json file.
    return parseServiceJson(serviceNameFilter, serviceJson);
  }
};

// convert a package.json into a service.json format and parse it.
exports.transformPackageJson = function(packageJson) {
  var serviceJson = {},
    innerJson = serviceJson[packageJson.name] = {};

  // map fields from the format expected in package.json, to the format
  // used by service.json.
  if (packageJson.description) innerJson.description = packageJson.description;
  if (packageJson.scripts) innerJson.scripts = packageJson.scripts;
  if (packageJson.service) { // special fields specific to ndm.
    if (packageJson.service.args) innerJson.args = packageJson.service.args;
    if (packageJson.service.env) innerJson.env = packageJson.service.env;
  }

  return serviceJson;
}

// service.json files can be used to describe multiple
// services, they have a slightly different format than
// package.json.
function parseServiceJson(serviceNameFilter, serviceJson) {
  var services = [],
    config = require('./config')();

  Object.keys(serviceJson).forEach(function(serviceName) {
    if (serviceName === 'env' || serviceName === 'args') return;

    var serviceConfig = serviceJson[serviceName],
      processCount = serviceConfig.processes || 1;

    // if services have a process count > 1,
    // we'll create multiple run-scripts for them.
    _.range(processCount).forEach(function(i) {

      // apply sane defaults as we create
      // the services.
      var service = new Service(_.extend(
        {
          module: serviceName,
          name: i > 0 ? (serviceName + '-' + i) : serviceName
        },
        serviceConfig
      ));

      // override env and args with global args and env.
      service.env = _.extend({},
        dropInterviewQuestions(serviceJson.env),
        dropInterviewQuestions(serviceConfig.env)
      );

      service.args = serviceConfig.args;

      if (_.isArray(serviceConfig.args)) {
        // combine arrays of arguments, if both top-level args.
        // and service-level args are an array.
        if (_.isArray(serviceJson.args)) service.args = [].concat(serviceJson.args, service.args);
      } else {
        // merge objects together if top-level, and service level
        // arguments are maps.
        service.args = _.extend({},
          dropInterviewQuestions(serviceJson.args),
          dropInterviewQuestions(serviceConfig.args)
        );
      }

      // we can optionaly filter to a specific service name.
      if (serviceNameFilter && service.name !== serviceNameFilter && !config.globalPackage) return;

      // replace placeholder variables
      // in the service.json.
      expandVariables(service, i);

      services.push(service);
    });
  });

  return services;
}

// convert defaults of form "argument": {"default": "33", description: "my arg"}.
// to values that can be used when generating services.
function dropInterviewQuestions(o) {
  return _.reduce(o, function(result, v, k) {
    var value = typeof v === 'object' ? v.default : v;
    return (result[k] = value, result)
  }, {});
}

// the %i placeholder can be used to reference the process
// number in args/env variables within service.json.
function expandVariables(service, processNumber) {
  // first the simple case of env, which is always an object.
  service.env = _.reduce(service.env, function(result, v, k) {
    var value = typeof v === 'string' ? v.replace(/%i/g, processNumber) : v;
    return (result[k] = value, result)
  }, {});


  // next, the more annoying usecase of args which can be
  // an array on an object.
  if (_.isArray(service.args)) {
    service.args = _.map(service.args, function(arg) {
      return typeof arg === 'string' ? arg.replace(/%i/g, processNumber) : arg;
    });
  } else {
    service.args = _.reduce(service.args, function(result, v, k) {
      var value = typeof v === 'string' ? v.replace(/%i/g, processNumber) : v;
      return (result[k] = value, result)
    }, {});
  }
};

// look for a service manifest in cascade of logical places.
exports._serviceJsonPath = function(serviceNameFilter) {
  var config = require('./config')(),
    packageJsonPath = path.resolve(path.dirname(config.serviceJsonPath), './package.json'),
    baseWorkingDirectory = null,
    pathsToCheck = [
      path.resolve(config.modulePrefix, 'node_modules'),
      path.resolve(config.modulePrefix, 'lib', 'node_modules'),
      './node_modules',
      config.baseWorkingDirectory,
      path.resolve(config.baseWorkingDirectory, '../')
    ];

  if (fs.existsSync(config.serviceJsonPath)) return config.serviceJsonPath;
  else if (fs.existsSync(packageJsonPath) && !serviceNameFilter) return packageJsonPath;
  else if (!serviceNameFilter) return config.serviceJsonPath;

  var baseWorkingDirectory = _.filter(pathsToCheck, function(serviceJsonPath) {
    return fs.existsSync(
      path.resolve(serviceJsonPath, serviceNameFilter)
    );
  })[0];

  // we found a good candidate for a
  // working directory, update config appropriately.
  if (baseWorkingDirectory) {
    baseWorkingDirectory = path.resolve(baseWorkingDirectory, serviceNameFilter);
    config.baseWorkingDirectory = baseWorkingDirectory;

    var serviceJsonPath = path.resolve(baseWorkingDirectory, 'service.json'),
      packageJsonPath = path.resolve(baseWorkingDirectory, 'package.json');

    // look for a service.json, fall back to the package.json.
    if (fs.existsSync(serviceJsonPath)) config.serviceJsonPath = serviceJsonPath;
    else config.serviceJsonPath = packageJsonPath;

    // only use global logs directory if we're not overriding the logs dir.
    if (config.logsDirectory === config.defaultLogsDirectory()) {
      config.logsDirectory = config.osLogsDirectory;
    }

    //use global interpretation of commands: ndm <cmd> <global-package>
    config.globalPackage = true;
  };

console.log(config.serviceJsonPath);
  return config.serviceJsonPath;
};
