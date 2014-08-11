var _ = require('lodash'),
  CliSelfInstall = require('./cli-self-install');

module.exports = function(packageName, opts) {
  return CliSelfInstall(_.extend({
    filter: packageName
  }, opts));
};
