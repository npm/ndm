require('../lib/config')({headless: true}); // turn off output in tests.

var lab = require('lab'),
  expect = lab.expect,
  Lab = exports.lab = lab.script();

Lab.experiment('logger', function() {
  Lab.experiment('errorLogged', function() {
    Lab.it('should return true if an error has been logged', function(done) {
      require('../lib/logger').error("I am an error.");
      expect(require('../lib/logger').errorLogged()).to.eql(true);
      done();
    });
  });
});
