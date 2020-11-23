// the CLI helper used by ndm itself.
const _ = require('lodash')
let cli = null
const CliBase = require('./cli-base').CliBase
const config = require('./config')()
const fs = require('fs')
const Installer = require('./installer')
const path = require('path')
const Service = require('./service')
const util = require('util')
const npmconf = require('npmconf')

// handle a user interacting with the
// command-line, update config appropriately,
// output human readable messages.
function Cli (opts) {
  _.extend(this, {
    logger: require('./logger'),
    Interview: require('./interview'),
    service: Service,
    rimraf: require('rimraf'),
    yargs: require('yargs'), // overridable parsed arguments.
    takenFlags: [],
    commands: {
      install: 'ask user about environment variables and install service.',
      start: 'start all, or a specific service.',
      stop: 'stop all, or a specific service.',
      restart: 'restart all, or a specific service.',
      remove: 'remove OS-specific daemon wrappers.',
      init: 'create the ndm service.json.',
      generate: 'generate OS-specific daemon wrappers.',
      update: 'update service.json with new services.',
      list: 'list all services availble in service.json',
      interview: 'ask the user to fill in missing fields in service.json',
      'run-script': 'run script with env and args from service.json',
      'list-scripts': 'list all the scripts provided by ndm services',
      version: 'print the current version of ndm that is installed'
    }
  }, opts)
};

util.inherits(Cli, CliBase)

// actually run the cli, the cli is also
// included and used for logging.
Cli.prototype.run = function () {
  const _this = this
  let argv = null

  this.generateArgs()

  argv = this.yargs.argv

  if (argv._.length === 0 || argv.help) {
    this.logger.log(this.yargs.help())
  } else if (!this.commands[argv._[0]]) {
    this.logger.error('command ' + argv._[0] + ' not found')
    this.logger.log(this.yargs.help())
  } else {
    // make the aliases actually work.
    argv = this.yargs.normalize().argv

    npmconf.load(function (er, conf) {
      // update config singleton.
      _this.updateConfigWithNpmconf(conf)
      _this.updateConfigWithArgs(argv)
      config.updateWithOSDefaults()

      try { // execute the command, passing along args.
        _this[argv._[0]].apply(_this, argv._.slice(1))
      } catch (e) {
        _this.logger.error(e.message)
      }
    })
  }
}

// initialize ndm directory.
Cli.prototype.init = function () {
  this.logger.log('setting up ndm directory:');
  (new Installer()).init()
}

// update service.json with new
// services in package.json.
Cli.prototype.update = function () {
  this.logger.log('updating service.json:');
  (new Installer()).update()
}

// list all available services.
Cli.prototype.list = function (serviceName) {
  const _this = this

  this.service.allServices(serviceName).forEach(function (service) {
    _this.logger.log(service.name + ':\t' + service.description)
  })
}

// interactive Q/A session with service.json.
Cli.prototype.interview = function () {
  const interview = new this.Interview()
  interview.run(function () {})
}

// prints the current version of ndm that is installed.
Cli.prototype.version = function () {
  const packageJson = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../package.json'), 'utf-8'
  ))

  this.logger.success('ndm version ' + packageJson.version)
  this.logger.warn('services in the cloud!')
}

// export CLI as a singleton, to that
// it can easily be imported for logging.
module.exports = function (opts) {
  if (!opts && cli) return cli
  else {
    cli = new Cli(opts)
    return cli
  }
}
