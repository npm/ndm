var _ = require('lodash'),
  CliSelfInstall = require('./cli-self-install');

module.exports = function(serviceName, opts) {
  return CliSelfInstall(_.extend({
    serviceName: serviceName
  }, opts));
};
