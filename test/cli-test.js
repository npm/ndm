var Lab = require('lab'),
  path = require('path'),
  Config = require('../lib').Config,
  _ = require('lodash');

Lab.experiment('cli', function() {
  Lab.experiment('generate', function() {
    Lab.it('should generate options from config class', function(done) {
      done();
    });

    Lab.it('should generate list of commands from execute list', function(done) {
      done();
    });
  });

  Lab.experiment('help', function() {
    Lab.it('should print help if no arguments are given', function(done) {
      done();
    });

    Lab.it('should print help if --help is given', function(done) {
      done();
    });

    Lab.it('should print help if command is not found', function(done) {
      done();
    });

  });

  Lab.experiment('execute', function () {
    Lab.it('should execute non-hyphenated option as command', function(done) {
      done();
    });

    Lab.it('should pass additional non-hyphenated commands as args', function(done) {
      done();
    });
  });
});
