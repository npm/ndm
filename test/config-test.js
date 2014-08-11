var Lab = require('lab'),
  path = require('path'),
  Config = require('../lib').Config,
  _ = require('lodash');

Lab.experiment('config', function() {
  Lab.it('should be initialized with sane defaults', function(done) {
    var config = Config();
    Lab.expect(config.baseWorkingDirectory).to.match(/ndm/);
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
      env: {NDM_BASE_WORKING_DIRECTORY: '/foo'}
    });
    Lab.expect(config.baseWorkingDirectory).to.eql('/foo');
    done();
  });

  Lab.it('should set OS specific environment variables', function(done) {
    var config = Config({
      platform: 'darwin'
    });
    Lab.expect(config.daemonsDirectory).to.eql('~/Library/LaunchAgents/');
    done();
  });

  Lab.it('should allow OS specific variables to be overridden', function(done) {
    var config = Config({
      platform: 'darwin',
      daemonsDirectory: '/foo'
    });
    Lab.expect(config.daemonsDirectory).to.eql('/foo');
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

  Lab.it('should detect centos based on a release version file', function(done) {
    var config = Config({
      releaseInfoFile: './test/fixtures/redhat-release'
    });

    Lab.expect(config.platform).to.eql('centos');
    done();
  });

  Lab.it('should read .ndmrc, and allow default settings to be overridden', function(done) {
    var config = Config();
    Lab.expect(config.releaseInfoFile).to.eql('/foo/bar/release');
    done();
  });


});
