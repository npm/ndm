var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  logger = require('./logger');

// install ndm service.json, and initialize
// the ndm directory based on package.json.
function Installer(opts) {
  _.extend(this,
    {},
    require('./config')(),
    opts
  );
}

// create the service.json from the package.json.
Installer.prototype.init = function() {
  var logDirectory = path.resolve(this.baseWorkingDirectory, 'logs');

  this._generateServiceJson();

  mkdirp.sync(logDirectory);
  logger.warn("  created " + logDirectory);
  this._printInitMessage();
};

// this method handles both the update and generation use-case.
Installer.prototype._generateServiceJson = function(update) {
  var _this = this,
    packageJson = this._getPackageJson(this.baseWorkingDirectory),
    servicesJson = {},
    servicesJsonPath = path.resolve(
      this.baseWorkingDirectory,
      'service.json'
    );

  if (update && !(fs.existsSync(servicesJsonPath))) {
    throw Error(servicesJsonPath + ' does not exist. run ndm init.')
  } else if (update) {
    servicesJson = JSON.parse(fs.readFileSync(servicesJsonPath));
  } else if (fs.existsSync(servicesJsonPath)) {
    throw Error(servicesJsonPath + ' already exists.');
  }

  if (!packageJson.dependencies) throw Error('no services found, add dependencies to package.json.');

  // walk all the dependencies in package.json, and copy
  // env, args, and scripts into default serviceJson.
  Object.keys(packageJson.dependencies).forEach(function(module) {
    var moduleDirectory = path.resolve(
        _this.baseWorkingDirectory,
        'node_modules',
        module
      ),
      serviceJson = null,
      moduleJson = null;

    moduleJson = _this._getPackageJson(moduleDirectory);
    serviceJson = moduleJson.ndm || {};

    if (!servicesJson[module]) servicesJson[module] = {
      description: moduleJson.description,
      scripts: removeNodeBin(moduleJson.scripts) || {},
      env: serviceJson.env || {},
      args: serviceJson.args || {},
    }
  });

  fs.writeFileSync(servicesJsonPath, JSON.stringify(servicesJson, null, '  '));
  logger.warn("  generated " + servicesJsonPath);
};

// update service.json with new entries in package.json.
Installer.prototype.update = function() {
  this._generateServiceJson(true);
  this._printInitMessage();
};

Installer.prototype._getPackageJson = function(basePath) {
  var packagePath = path.resolve(
    basePath,
    'package.json'
  );

  if (!fs.existsSync(packagePath)) throw Error(packagePath + " did not exist.\nadd your dependencies to package.json, and run npm install.")

  return JSON.parse(
    fs.readFileSync(packagePath).toString()
  );
};

// tell the user how to start services after they run init.
Installer.prototype._printInitMessage = function() {
  logger.log("\nedit aservice.json' to setup your application's environment.");
  logger.log("when you're ready, run 'ndm generate' to generate service wrappers.");
  logger.log("add dependencies to 'package.json' and run 'ndm update' to add additional services.");
  logger.success("\nsuccess!");
};

// remove references to the node bin from scripts,
// the service wrappers we generate add it back with an
// absolute execution path.
function removeNodeBin(o) {
  return _.reduce(o, function(result, v, k) {
    return (result[k] = v.replace(/^node +/, ''), result)
  }, {});
};

module.exports = Installer;
