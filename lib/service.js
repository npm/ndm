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

  // run the script within its ndm
  // node_modules directory.
  this.workingDirectory = this._workingDirectory();

  this.logFile = this.utils.resolve(
    this.logsDirectory,
    this.name + ".log"
  )
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

// Generate a daemon wrapper from an ejs template.
Service.prototype.generateScript = function() {
  if (this.runnable()) {
    // create copy of args, so that we can
    // non-destructively update with args from scipts.start.
    var flatArgs = this._flattenArgs();

    // add all arguments after -- to generated
    // script as run arguments.
    process.argv.slice(
      process.argv.indexOf('--') + 1
    ).forEach(function(arg) {
      flatArgs.push(arg)
    });

    fs.writeFileSync(
      this.scriptPath(),
      ejs.render(fs.readFileSync(this.template).toString(), _.merge({}, this, {
        startScript: this._startScript(flatArgs),
        flatArgs: flatArgs
      })),
      {
        mode: 0755
      }
    );
  } else {
    this.logger.warn('  ' + this.name + ' does not have start script.');
  }
};

// Remove the generated daemon wrapper
Service.prototype.removeScript = function() {
  if (this.runnable()) {
    rimraf.sync(this.scriptPath());
  }
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
  if (this.runnable()) {
    this.utils.exec(
      (this.sudo ? 'sudo ' : '') + this['_' + command + 'Command'](),
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

// start/stop/restart commands for the service wrappers.
Service.prototype._startCommand = function() {
  if (this.platform === 'centos') {
    return 'initctl start ' + this.name;
  } else if (this.platform === 'darwin') {
    return 'launchctl load ' + this.scriptPath();
  }

  return 'service ' + this.name + ' start';
};

Service.prototype._restartCommand = function() {
  if (this.platform === 'centos') {
    return 'initctl restart ' + this.name;
  } else if (this.platform === 'darwin') {
    return 'launchctl unload ' + this.scriptPath() + ';launchctl load ' + this.scriptPath();
  }

  return 'service ' + this.name + ' restart';
};

Service.prototype._stopCommand = function() {
  if (this.platform === 'centos') {
    return 'initctl stop ' + this.name;
  } else if (this.platform === 'darwin') {
    return 'launchctl unload ' + this.scriptPath();
  }

  return 'service ' + this.name + ' stop';
};

Service.prototype.listScripts = function() {
  var _this = this,
    msg = "";

  Object.keys(this.scripts).forEach(function(name) {
    msg += "  " + name + "\n";
  });

  this.logger.success(msg.replace(/\n$/, ''));
};

exports.printRunMessage = function() {
  var logger = require('./logger');

  logger.log("\nto start a all services run: 'ndm start'");
  logger.log("or manually start the service using 'launchctl', 'initctl', or 'upstart'");
  logger.success("\nsuccess!");
};

// load and return all services.
exports.allServices = function() {
  var services = [],
    serviceJson = null,
    serviceJsonPath = require('./config')().serviceJsonPath,
    utils = require('./utils');

  // raise a human readable error if we can't find
  // the service.json file.
  try {
    serviceJson = fs.readFileSync(
      utils.resolve(serviceJsonPath)
    ).toString();

  } catch (e) {
    throw Error('could not load ' + serviceJsonPath + ' run ndm init, to create a service.json from your package.json.')
  }

  try {
    serviceJson = JSON.parse(serviceJson);

    // support an array of args, rather than object.
    if (_.isArray(serviceJson.args)) {
      serviceJson.args = arrayToObject(serviceJson.args);
    }
  } catch (e) {
    throw Error('invalid service.json, check file for errors.');
  }

  Object.keys(serviceJson).forEach(function(serviceName) {
    if (serviceName === 'env' || serviceName === 'args') return;

    var serviceConfig = serviceJson[serviceName];

    // support an array of args, rather than object.
    if (_.isArray(serviceConfig.args)) {
      serviceConfig.args = arrayToObject(serviceConfig.args);
    }

    // apply sane defaults as we create
    // the services.
    var service = new Service(_.extend(
      {
        module: serviceName,
        name: serviceName
      },
      serviceConfig
    ));

    // override env and args with global args and env.
    service.env = _.extend({},
      dropInterviewQuestions(serviceJson.env),
      dropInterviewQuestions(serviceConfig.env)
    );

    service.args = _.extend({},
      dropInterviewQuestions(serviceJson.args),
      dropInterviewQuestions(serviceConfig.args)
    );

    services.push(service);
  });

  return services;
};

// convert old-style array arguments to an object.
function arrayToObject(a) {
  // convert ['a', 2, 'b', 4] => {'a': 2, 'b': 4}.
  var object = _.object(
    _.toArray(
      _.groupBy(a, function(v, i) {return Math.floor(i / 2);})
    )
  );

  // get rid of undefined values.
  return _.reduce(object, function(result, v, k) {
    var value = typeof v === 'undefined' ? '' : v;
    return (result[k] = value, result)
  }, {});
}

// convert defaults of form "argument": {"default": "33", description: "my arg"}.
// to values that can be used when generating services.
function dropInterviewQuestions(o) {
  return _.reduce(o, function(result, v, k) {
    var value = typeof v === 'object' ? v.default : v;
    return (result[k] = value, result)
  }, {});
};
