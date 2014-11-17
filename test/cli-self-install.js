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

  Lab.experiment('calls methods on super-class', function() {

    Lab.it('executes super-class install', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        CliBase: {
          prototype: {
            install: function(filter) {
              expect(filter).to.eql('ndm-test');
              return done();
            }
          }
        }
      });
      ndm.install();
    });

    Lab.it('executes super-class list-scripts', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        'list-scripts': function(filter) {
          expect(filter).to.eql('ndm-test');
          return done();
        }
      });
      ndm.listScripts();
    });

    Lab.it('executes super-class run-script', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        'run-script': function() {
          return done();
        }
      });
      ndm.runScript();
    });

    Lab.it('executes super-class remove', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        CliBase: {
          prototype: {
            remove: function(filter) {
              expect(filter).to.eql('ndm-test');
              return done();
            }
          }
        }
      });
      ndm.remove();
    });

    Lab.it('executes super-class _runCommand', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        CliBase: {
          prototype: {
            _runCommand: function(command, filter) {
              expect(command).to.eql('foo');
              expect(filter).to.eql('ndm-test');
              return done();
            }
          }
        }
      });
      ndm._runCommand('foo');
    });
  });

  Lab.experiment('npmconf', function() {
    Lab.it('updates configuration with npmconf, when install is called', function(done) {
      var ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        updateConfigWithNpmconf: function(conf) {
          expect(typeof conf.get('prefix')).to.eql('string');
          return done();
        }
      });
      ndm.install();
    });
  });
});
