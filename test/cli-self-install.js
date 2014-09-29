require('../lib/config')({headless: true}); // turn off output in tests.

var lab = require('lab'),
  Lab    = exports.lab = lab.script(),
  expect = lab.expect,
  path   = require('path'),
  _      = require('lodash');

Lab.experiment('cli-self-install', function() {
  Lab.experiment('init', function() {
    Lab.it('should infer module name based on package.json', function(done) {
      var ndm = require('../lib')('ndm-test');
      expect(ndm.filter).to.eql('ndm-test');
      done();
    });

    Lab.it('should allow api opts to be overridden', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs'
      });
      expect(ndm.logsDirectory).to.eql('/foo/logs');
      done();
    });
  });
});
