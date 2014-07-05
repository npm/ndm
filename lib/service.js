var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  ejs = require('ejs'),
  exec = require('child_process').exec,
  logger = require('./logger');

// an OS-specific service wrapper for
// a Node.js process.
function Service(opts) {
  _.extend(this,
    {
      description: ''
    },
    require('./config')(),
    opts
  );

  // run the script within its ndm
  // node_modules directory.
  this.workingDirectory = path.resolve(
    this.baseWorkingDirectory,
    './node_modules',
    this.module
  )

  this.logFile = path.resolve(
    this.baseWorkingDirectory,
    './logs',
    this.name + ".log"
  )
};

// Generate a daemon wrapper from an ejs template.
Service.prototype.generateScript = function() {
  fs.writeFileSync(
    this.scriptPath(),
    ejs.render(fs.readFileSync(this.template).toString(), this),
    {
      mode: 0755
    }
  );
};

// where should we save the system daemon to?
// /etc/init.d, ~/Library/LaunchAgents.
Service.prototype.scriptPath = function() {
  return path.resolve(
    this.daemonsDirectory.replace('~/', process.env['HOME'] + '/'),
    this.name + this.daemonExtension
  );
};

// actually exec a command, optionally as a super user.
Service.prototype.runCommand = function(command, cb) {
  exec((this.sudo ? 'sudo ' : '') + this['_' + command + 'Command'](), function(err, stdout, stderr) {
    if (stdout) logger.log('  ' + stdout.trim());
    else if (stderr) logger.error('  ' + stderr.trim());

    if (err) {
      cb(err);
    } else {
      cb();
    }
  });
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

exports.printRunMessage = function() {
  logger.log("\nto start a all services run: 'ndm start'");
  logger.log("or manually start the service using 'launchctl', 'initctl', or 'upstart'");
  logger.success("\nsuccess!");
};

// load and return all services.
exports.allServices = function() {
  var services = [],
    serviceJson = null,
    serviceJsonPath = require('./config')().serviceJsonPath;

  // raise a human readable error if we can't find
  // the service.json file.
  try {
    serviceJson = fs.readFileSync(
      path.resolve(serviceJsonPath)
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
