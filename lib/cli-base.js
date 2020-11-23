// base class used by ndm itself, and by the
// ndm self-install-api.
const _ = require('lodash')
const async = require('async')
const cli = null
const config = require('./config')()
const Service = require('./service')
const Installer = require('./installer')
const S = require('string')
const temp = require('temp')

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function CliBase () {}

// updates the configuration singleton
// with any important npm configuration
CliBase.prototype.updateConfigWithNpmconf = function (conf) {
  if (!config.modulePrefix || config.modulePrefix === '') {
    config.modulePrefix = conf.get('prefix')
  }
}

// updates the configuration singleton
// with any CLI args passed in.
CliBase.prototype.updateConfigWithArgs = function (argv) {
  config._argv = argv // keep track of argv overrides.

  _.keys(config).forEach(function (key) {
    if (argv[key] && typeof config[key] !== 'function') {
      config[key] = config.parsers[key] ? config.parsers[key](argv[key]) : argv[key]
    }
  })
}

// generate kwargs CLI parser from config.
CliBase.prototype.generateArgs = function () {
  const _this = this
  const descriptions = config.descriptions()
  const options = {}

  // populate config flags.
  _.forIn(config, function (value, key) {
    if (descriptions[key]) {
      options[_this._getFlag(key.toLowerCase())] = {
        alias: S(key).dasherize().s,
        describe: descriptions[key],
        default: config[key]
      }
    }
  })

  _this.yargs.options(options)

  // now add the usage info.
  this.generateUsage()
}

CliBase.prototype.generateUsage = function () {
  const _this = this
  const usage = 'Deploy service daemons directly from npm packages:\n\nUsage: $0 <cmd> [options]'

  _.forIn(this.commands, function (value, key) {
    _this.yargs.command(key, value)
  })

  this.yargs.example('ndm run-script [<script-name>]', 'run a script using the arguments and environment variables in service.json')
  this.yargs.example('ndm generate', 'generate os-specific run scripts (upstart, init.d, .plist, etc.)')
  this.yargs.example('ndm start', 'start all the generated run scripts')

  this.yargs.usage(usage)
}

// iterate over the key, and find a flag
// that hasn't yet been used.
CliBase.prototype._getFlag = function (candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const char = candidates.charAt(i)
    if (this.takenFlags.indexOf(char) === -1) {
      this.takenFlags.push(char)
      return char
    }
  }
}

// generate service-daemons from
// service.json
CliBase.prototype.generate = function () {
  const _this = this
  const config = require('./config')()

  this.logger.log('generating service wrappers:')

  // generate OS-specific daemon wrappers, this process
  // can be asynchrnous.
  async.each(this.service.allServices(config.filter), function (service, done) {
    service.generateScript(function (err) {
      _this.logger.warn('  generated ' + service.scriptPath())
      _this.logger.warn('  log path: ' + service.logFile)
      done()
    })
  }, function () {
    _this.service.printRunMessage()
  })
}

// remove service-daemons
CliBase.prototype.remove = function (serviceName) {
  const _this = this

  // stop services before removing their wrappers.
  this.stop(serviceName, function () {
    // now remove the wrapper for each service.
    _this.service.allServices(serviceName).forEach(function (service) {
      service.removeScript(function () {
        _this.logger.warn('  removed ' + service.scriptPath())
      })
    })
  })
}

// start|stop|restart services.
CliBase.prototype.start = function (serviceName, cb) {
  this.logger.log('starting services:')
  this._runCommand('start', serviceName, cb)
}

CliBase.prototype.stop = function (serviceName, cb) {
  this.logger.log('stopping services:')
  this._runCommand('stop', serviceName, cb)
}

CliBase.prototype.restart = function (serviceName, cb) {
  this.logger.log('restarting services')
  this._runCommand('restart', serviceName, cb)
}

CliBase.prototype._runCommand = function (command, serviceName, cb) {
  const _this = this

  async.each(this.service.allServices(serviceName), function (service, done) {
    service.runCommand(command, function (err) {
      _this.logger.warn('  ' + command + ' ' + service.scriptPath())
      done()
    })
  }, cb)
}

// Ask a user questions about the service they're
// installing, and install it.
CliBase.prototype.install = function (serviceName) {
  const _this = this
  const tmpServiceJsonPath = temp.path({ suffix: '.json' })
  const srcServiceJsonPath = Service._serviceJsonPath(serviceName)
  const interview = new this.Interview({
    serviceJsonPath: srcServiceJsonPath,
    tmpServiceJsonPath: tmpServiceJsonPath
  })

  interview.run(function () {
    config.tmpServiceJsonPath = tmpServiceJsonPath // point to temporary config.
    _this.generate(serviceName) // generate the service wrappers.
    _this.rimraf.sync(tmpServiceJsonPath) // remove the temporary service.json.
  })
}

// list all available scripts.
CliBase.prototype['list-scripts'] = function (serviceName) {
  const _this = this

  this.service.allServices(serviceName).forEach(function (service) {
    _this.logger.log(service.name + ':\t' + service.description)
    service.listScripts()
  })
}

// run a script from package.json's scripts block, in the
// context of service.json's args and envs.
CliBase.prototype['run-script'] = function (scriptName) {
  const _this = this
  const filter = config.filter
  let scriptsExecuted = 0

  scriptsExecuted = _.filter(this.service.allServices(filter), function (service) {
    if (!service.hasScript(scriptName)) return false

    service.runScript(scriptName, function (err) {
      if (err) _this.logger.error(err)
    })

    return true
  }).length

  if (!scriptsExecuted) this['list-scripts']()
}

exports.CliBase = CliBase
