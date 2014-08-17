// An API for executing OS-specific commands,
// and generating OS-specific daemon scripts.
function PlatformBase(opts) {
  _.extend(this, {
    template: __dirname, '../templates/upstart-ubuntu.ejs'
  }, opts);
}

// Return any OS specific configuration overrides, e.g.,
// where are logs traditionally placed on the given OS.
PlatformBase.prototype.getConfigOverrides = function() {
  return {};
};

// Given an abstract service, and CLI arguments, generate
// service wrappers, e.g., upstart .conf files, and place
// them in the appropriate location on the OS.
PlatformBase.prototype.generateServiceScript = function(service, arguments, cb) {
  throw Error('must implement generateServiceScript()');
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
