var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  ejs = require('ejs'),
  exec = require('child_process').exec,
  clc = require('cli-color');

function Service(opts) {
  _.extend(this,
    {},
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

Service.prototype.generateScript = function() {
  fs.writeFileSync(
    this.scriptPath(),
    ejs.render(fs.readFileSync(this.template).toString(), this),
    {
      mode: 0755
    }
  );
};

Service.prototype.scriptPath = function() {
  return path.resolve(
    this.daemonsDirectory.replace('~/', process.env['HOME'] + '/'),
    this.name + this.daemonExtension
  );
};

Service.prototype.runCommand = function(command, cb) {
  exec(this.sudo ? 'sudo ' : '' + this['_' + command + 'Command'](), function(err, stdout, stderr) {
    if (err) {
      cb(err);
    } else {
      if (stdout) console.log("\n" + clc.white(stdout));
      else if (stderr) console.log("\n" + clc.red(stderr));
      cb();
    }
  });
};

Service.prototype._startCommand = function() {
  if (this.platform === 'centos') {
    return 'sudo initctl start' + this.name;
  } else if (this.platform === 'darwin') {
    return 'launchctl load ' + this.scriptPath();
  }

  return 'service ' + this.name + ' start';
};

Service.prototype._restartCommand = function() {
  if (this.platform === 'centos') {
    return 'sudo initctl restart' + this.name;
  } else if (this.platform === 'darwin') {
    return 'launchctl unload ' + this.scriptPath() + ';launchctl load ' + this.scriptPath();
  }

  return 'service ' + this.name + ' restart';
};

Service.prototype._stopCommand = function() {
  if (this.platform === 'centos') {
    return 'initctl stop' + this.name;
  } else if (this.platform === 'darwin') {
    return 'launchctl unload ' + this.scriptPath();
  }

  return 'service ' + this.name + ' stop';
};

exports.allServices = function() {
  var services = [],
    serviceJson = null,
    serviceJsonPath = require('./config')().serviceJson;

  // raise a human readable error if we can't find
  // the service.json file.
  try {
    serviceJson = JSON.parse(fs.readFileSync(
      path.resolve(serviceJsonPath)
    ));
  } catch (e) {
    throw Error('could not load ' + serviceJsonPath + ' run ndm init, to create a service.json from your package.json.')
  }

  Object.keys(serviceJson).forEach(function(serviceName) {
    if (serviceName === 'env' || serviceName === 'args') return;

    var serviceConfig = serviceJson[serviceName];

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
    service.env = _.extend({}, serviceConfig.env, serviceJson.env);
    service.args = (serviceConfig.args || []).concat(serviceJson.args || []);

    services.push(service);
  });

  return services;
}
