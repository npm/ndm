/**
smart configuration system, that takes into accoutn CLI,
Environment, and tries to guess some sane defaults
based on OS.
*/
var Lab = require('lab'),
  path = require('path'),
  Config = require('../lib').Config,
  _ = require('lodash');

// See prepare-tests.js, for follower feed ordering.
Lab.experiment('config', function() {
  Lab.it('should be initialized with sane defaults', function(done) {
    var config = Config();
    Lab.expect(config.baseWorkingDirectory).to.match(/node_modules/);
    done();
  });

  Lab.it('should allow defaults to be overridden by opts', function(done) {
    var config = Config({
      baseWorkingDirectory: '/banana'
    });
    Lab.expect(config.baseWorkingDirectory).to.eql('/banana');
    done();
  });

  Lab.it('should allow defaults to be overridden by environment variables', function(done) {
    var config = Config({
      env: _.extend(process.env, {NDM_BASE_WORKING_DIRECTORY: '/foo'})
    });
    Lab.expect(config.baseWorkingDirectory).to.eql('/foo');
    done();
  });

  Lab.it('should set OS specific environment variables', function(done) {
    var config = Config({
      platform: 'darwin'
    });
    Lab.expect(config.servicesDirectory).to.eql('~/Library/LaunchAgents/');
    done();
  });

  Lab.it('should behave as a singleton once initialized', function(done) {
    Config({
      platform: 'banana'
    });

    var config = (require('../lib').Config)();

    Lab.expect(config.platform).to.eql('banana');
    done();
  });
});
