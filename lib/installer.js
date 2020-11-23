const _ = require('lodash')
const fs = require('fs')
const mkdirp = require('mkdirp')
const logger = require('./logger')
const utils = require('./utils')

// install ndm service.json, and initialize
// the ndm directory based on package.json.
function Installer (opts) {
  _.extend(this,
    {},
    require('./config')(),
    opts
  )
}

// create the service.json from the package.json.
Installer.prototype.init = function () {
  const logDirectory = utils.resolve(this.baseWorkingDirectory, 'logs')

  this._generateServiceJson()
  mkdirp.sync(logDirectory)

  logger.warn('  created ' + logDirectory)
  this._printInitMessage()
}

// this method handles both the update and generation use-case.
Installer.prototype._generateServiceJson = function (update) {
  const _this = this
  const packageJson = this._getPackageJson(this.baseWorkingDirectory)
  let servicesJson = {}

  if (update && !(fs.existsSync(this.serviceJsonPath))) {
    throw Error(serviceJsonPath + ' does not exist. run ndm init.')
  } else if (update) {
    servicesJson = utils.loadServiceJson(this.serviceJsonPath)
  } else if (fs.existsSync(this.serviceJsonPath)) {
    throw Error(_this.serviceJsonPath + ' already exists.')
  }

  if (!packageJson.dependencies) throw Error('no services found, add dependencies to package.json.')

  // walk all the dependencies in package.json, and copy
  // env, args, and scripts into default serviceJson.
  Object.keys(packageJson.dependencies).forEach(function (module) {
    const moduleDirectory = utils.resolve(
      _this.baseWorkingDirectory,
      'node_modules',
      module
    )
    const moduleName = module.replace(/^@.*\//, '')
    let serviceJson = null
    let moduleJson = null

    moduleJson = _this._getPackageJson(moduleDirectory)
    serviceJson = moduleJson.service || {}

    if (!servicesJson[moduleName]) {
      servicesJson[moduleName] = {
        description: moduleJson.description,
        scripts: _.merge({}, moduleJson.bin, moduleJson.scripts),
        env: serviceJson.env || {},
        args: serviceJson.args || {}
      }

      // scoped packages should have a module stanza which
      // points to the appropriate folder.
      if (moduleName !== module) servicesJson[moduleName].module = module
    }
  })

  fs.writeFileSync(this.serviceJsonPath, JSON.stringify(servicesJson, null, '  '))
  logger.warn('  generated ' + this.serviceJsonPath)
}

// update service.json with new entries in package.json.
Installer.prototype.update = function () {
  this._generateServiceJson(true)
  this._printInitMessage()
}

Installer.prototype._getPackageJson = function (basePath) {
  const packagePath = utils.resolve(
    basePath,
    'package.json'
  )

  if (!fs.existsSync(packagePath)) throw Error(packagePath + ' did not exist.\nadd your dependencies to package.json, and run npm install.')

  return JSON.parse(
    fs.readFileSync(packagePath).toString()
  )
}

// tell the user how to start services after they run init.
Installer.prototype._printInitMessage = function () {
  logger.log("\nedit aservice.json' to setup your application's environment.")
  logger.log("when you're ready, run 'ndm generate' to generate service wrappers.")
  logger.log("add dependencies to 'package.json' and run 'ndm update' to add additional services.")
  logger.success('\nsuccess!')
}

module.exports = Installer
