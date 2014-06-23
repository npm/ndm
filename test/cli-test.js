var Lab = require('lab'),
  path = require('path'),
  Cli = require('../lib').Cli,
  _ = require('lodash');

Lab.experiment('cli', function() {
  Lab.experiment('generateArgs', function() {
    Lab.it('should generate options from config class', function(done) {
      var cli = Cli();

      cli.generateArgs();

      var help = cli.yargs.help();

      // generations option.
      Lab.expect(help).to.match(/-u/);
      // generates alias.
      Lab.expect(help).to.match(/-sudo/);
      // generates description.
      Lab.expect(help).to.match(/where does the node executable reside/)
      // generates defaults.
      Lab.expect(help).to.match(/default: "darwin"/);

      done();
    });

    Lab.it('should generate list of possible usage commands', function(done) {
      var cli = Cli();

      cli.generateArgs();

      var help = cli.yargs.help();

      Lab.expect(help).to.match(/ndm generate/);

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
