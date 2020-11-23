// API for init-d scripts.
const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const PlatformBase = require('./platform-base').PlatformBase
const util = require('util')

function InitD (opts) {
  _.extend(this, {
    platform: 'initd',
    template: path.resolve(__dirname, '../../templates/init-d.ejs')
  }, opts)
}

util.inherits(InitD, PlatformBase)

// override default config variables.
InitD.configOverrides = {
  osLogsDirectory: '/var/log',
  daemonsDirectory: '/etc/init.d',
  daemonExtension: '',
  sudo: true,
  uid: 'root'
}

InitD.prototype.start = function (service, cb) {
  service.execCommand('service ' + service.name + ' start', cb)
}

InitD.prototype.stop = function (service, cb) {
  service.execCommand('service ' + service.name + ' stop', cb)
}

InitD.prototype.restart = function (service, cb) {
  service.execCommand('service ' + service.name + ' restart', cb)
}

module.exports = InitD
