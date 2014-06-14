var _ = require('lodash'),
  Promise = require('bluebird');

function Installer(opts) {
  _.extend(this,
    {
      Npm: require('./npm')
    },
    require('config').get()
  );
}

module.exports = Installer;
