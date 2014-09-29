require('../../lib/config')({headless: true}); // turn off output in tests.

var Centos = require('../../lib/platform-apis/centos'),
  lab = require('lab'),
  expect = lab.expect,
  Lab = exports.lab = lab.script();

Lab.experiment('centos', function() {
  Lab.experiment('isPlatform', function() {
    Lab.it('should return true if releaseInfoFile contains the string Centos', function(done) {
      var centos = new Centos({
        releaseInfoFile: './test/fixtures/redhat-release'
      });
      expect(centos.isPlatform()).to.eql(true);
      done();
    });
  });
});
