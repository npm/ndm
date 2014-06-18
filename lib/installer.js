var _ = require('lodash'),
  Promise = require('bluebird'),
  fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp');

function Installer(opts) {
  _.extend(this,
    {},
    require('./config')(),
    opts
  );
}

Installer.prototype.init = function() {
  mkdirp.sync(path.resolve(this.baseWorkingDirectory, 'logs'))
  this._generateServiceJson();
};

Installer.prototype._generateServiceJson = function() {
  var _this = this,
    packageJson = this._getPackageJson(this.baseWorkingDirectory),
    servicesJson = {},
    serviceJsonPath = path.resolve(
      this.baseWorkingDirectory,
      'service.json'
    );

  if (fs.existsSync(serviceJsonPath)) throw Error(serviceJsonPath + ' already exists');

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

    servicesJson[module] = {
      description: moduleJson.description,
      bin: moduleJson.bin || moduleJson.main,
      env: serviceJson.env || {},
      args: serviceJson.args || {},
    }
  });

  fs.writeFileSync(serviceJsonPath, JSON.stringify(servicesJson, null, '\t'));
};

Installer.prototype._getPackageJson = function(basePath) {
  var packagePath = path.resolve(
    basePath,
    'package.json'
  );

  if (!fs.existsSync(packagePath)) throw Error(packagePath + ' did not exist. Make sure you have run npm install.')

  return JSON.parse(
    fs.readFileSync(packagePath).toString()
  );
};

module.exports = Installer;
