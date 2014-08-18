var _ = require('lodash'),
  ejs = require('ejs'),
  fs = require('fs'),
  rimraf = require('rimraf');

// An API for executing OS-specific commands,
// and generating OS-specific daemon scripts.
function PlatformBase(opts) {
  _.extend(this, {
    platform: null,
    // path to template to use for service generation,
    // use of a template may be optional.
    template: null
  }, opts);
}

// Return any OS specific configuration overrides, e.g.,
// where are logs traditionally placed on the given OS.
PlatformBase.configOverrides = {};

// return true if we detect that ndm is being run
// on this platform. e.g., isPlatform would return true
// on Centos if we find a releaseInfoFile with CentOS in it.
PlatformBase.prototype.isPlatform = function() { return false; };

// Given an abstract service, and CLI arguments, generate
// service wrappers, e.g., upstart .conf files, and place
// them in the appropriate location on the OS.
PlatformBase.prototype.generateServiceScript = function(service, args, cb) {
  fs.writeFileSync(
    service.scriptPath(),
    ejs.render(fs.readFileSync(this.template).toString(), _.merge({}, service, {
      startScript: service._startScript(args),
      flatArgs: args
    })),
    {
      mode: 0755
    }
  );

  return cb(); // allows for the option of async script generation.
};

// Remove the OS-specific script generated with ndm.
PlatformBase.prototype.removeScript = function(service, cb) {
  if (service.runnable()) rimraf.sync(service.scriptPath());
  return cb();
};

// OS-specific command for starting a service, e.g.,
// sudo service my-service start, for upstart.
PlatformBase.prototype.start = function(service, cb) {
  cb(Error('must implement start()'));
};

// OS-specific command for stopping abstract service.
PlatformBase.prototype.stop = function(service, cb) {
  cb(Error('must implement stop()'));
};

// OS-specific command for restarting abstract service.
PlatformBase.prototype.restart = function(service, cb) {
  cb(Error('must implement restart()'));
};

exports.PlatformBase = PlatformBase;
