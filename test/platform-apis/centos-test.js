require('../../lib/config')({headless: true}); // turn off output in tests.

var Centos = require('../../lib/platform-apis/centos'),
  Lab = require('lab');

Lab.experiment('centos', function() {
  Lab.experiment('isPlatform', function() {
    Lab.it('should return true if releaseInfoFile contains the string Centos', function(done) {
      var centos = new Centos({
        releaseInfoFile: './test/fixtures/redhat-release'
      });
      Lab.expect(centos.isPlatform()).to.eql(true);
      done();
    });
  });
});
