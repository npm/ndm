require('../../lib/config')({headless: true}); // turn off output in tests.

var PlatformBase = require('../../lib/platform-apis/platform-base').PlatformBase,
  Lab = require('lab');

Lab.experiment('platform-base', function() {
  Lab.experiment('restart', function() {

    Lab.it('should call stop', function(done) {
      var platform = new PlatformBase({
        logger: {
          error: function(msg) {
            Lab.expect(msg).to.eql('must implement stop()');
            done();
          }
        }
      });

      platform.restart('fake-service', function() {});
    });

    Lab.it('should call start', function(done) {
      var platform = new PlatformBase({
        stop: function(service, cb) {
          return cb();
        }
      });

      platform.restart('fake-service', function(err) {
        Lab.expect(err.message).to.eql('must implement start()');
        done();
      });
    });

  });
});
