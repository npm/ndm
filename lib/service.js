var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  ejs = require('ejs');

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
    path.resolve(this.daemonsDirectory, this.name + this.daemonExtension),
    ejs.render(fs.readFileSync(this.template).toString(), this),
    {
      mode: 0755
    }
  );
};

exports.allServices = function() {
  var services = [],
    serviceJson = JSON.parse(fs.readFileSync(
      path.resolve('./service.json')
    ));

  Object.keys(serviceJson).forEach(function(serviceName) {
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

    // populate the global env on the service.
    service.env = _.extend(serviceConfig.env, serviceJson.env);

    services.push(service);
  });

  return services;
}
