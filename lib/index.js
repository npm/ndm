const _ = require('lodash')
const CliSelfInstall = require('./cli-self-install')
const ndm = function (packageName, opts) {
  return CliSelfInstall(_.extend({
    filter: packageName,
    appName: packageName
  }, opts))
}

// some other exports are needed.for npme.
ndm.Interview = require('./interview')

module.exports = ndm
