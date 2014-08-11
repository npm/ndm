var _ = require('lodash'),
  CliSelfInstall = require('./cli-self-install'),
  ndm = function(packageName, opts) {
    return CliSelfInstall(_.extend({
      filter: packageName,
      appName: packageName
    }, opts));
  };

// some other exports are needed.for npme.
ndm.Interview = require('./interview');

module.exports = ndm;
