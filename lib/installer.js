var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  clc = require('cli-color');

function Installer(opts) {
  _.extend(this,
    {},
    require('./config')(),
    opts
  );
}

Installer.prototype.init = function() {
  var logDirectory = path.resolve(this.baseWorkingDirectory, 'logs');

  this._generateServiceJson();

  mkdirp.sync(logDirectory);
  console.log(clc.yellow("  created " + logDirectory));
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
  // env, args, and bin into default serviceJson.
  Object.keys(packageJson.dependencies).forEach(function(module) {
    var moduleDirectory = path.resolve(
        _this.baseWorkingDirectory,
        'node_modules',
        module
      ),
      serviceJson = null,
      moduleJson = null;

    moduleJson = _this._getPackageJson(moduleDirectory);
    serviceJson = moduleJson.service || {};

    if (!servicesJson[module]) servicesJson[module] = {
      description: moduleJson.description,
      bin: _this._getBin(moduleJson.bin),
      env: serviceJson.env || {},
      args: serviceJson.args || [],
    }
  });

  fs.writeFileSync(servicesJsonPath, JSON.stringify(servicesJson, null, '  '));
  console.log(clc.yellow("  generated " + servicesJsonPath));
};

Installer.prototype._getBin = function(binObject) {
  if (!binObject) {
    return 'npm start'
  } else if (typeof binObject === 'object') {
    return binObject[Object.keys(binObject)[0]];
  } else {
    return binObject;
  }
}

Installer.prototype.update = function() {
  this._generateServiceJson(true);
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

module.exports = Installer;
