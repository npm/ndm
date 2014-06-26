require('../lib/config')({headless: true}); // turn off output in tests.

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
      var cli = Cli({
        yargs: require('yargs')([]),
        logger: {
          log: function(str) {
            Lab.expect(str).to.match(/Usage:/);
            done();
          }
        }
      });

      cli.run();
    });

    Lab.it('should print help if --help is given', function(done) {
      var cli = Cli({
        yargs: require('yargs')(['generate', '--help']),
        logger: {
          log: function(str) {
            Lab.expect(str).to.match(/Usage:/);
            done();
          }
        }
      });

      cli.run();
    });

    Lab.it('should print help if command is not found', function(done) {
      var cli = Cli({
        yargs: require('yargs')(['foobar']),
        logger: {
          error: function(str) {},
          log: function(str) {
            Lab.expect(str).to.match(/Usage:/);
            done();
          }
        }
      });

      cli.run();
    });

  });

  Lab.experiment('execute', function () {
    Lab.it('should execute non-hyphenated option as command', function(done) {
      var cli = Cli({
        yargs: require('yargs')(['generate']),
        generate: function(serviceName) {
          Lab.expect(serviceName).to.be.undefined;
          done();
        }
      });

      cli.run();
    });

    Lab.it('should pass additional non-hyphenated commands as args', function(done) {
      var cli = Cli({
        yargs: require('yargs')(['start', 'foobar']),
        start: function(serviceName) {
          Lab.expect(serviceName).to.eql('foobar');
          done();
        }
      });

      cli.run();
    });
  });

  Lab.experiment('_runCommand', function() {
    Lab.it('runs a command on all services, if no service name given', function(done) {
      // fake array of services for allServices.
      var services = [
        {
          name: 'service1',
          runCommand: function(command) {
            Lab.expect(command).to.eql('start');
          }
        },
        {
          name: 'service2',
          runCommand: function(command) {
            Lab.expect(command).to.eql('start');
            done();
          }
        }
      ];

      var cli = Cli({
        service: {
          allServices: function() { return services; }
        }
      });

      cli._runCommand('start');
    });

    Lab.it('runs a command on a single service if service name is given', function(done) {
      // fake array of services for allServices.
      var services = [
        {
          name: 'service1',
          runCommand: function(command) {
            throw Error('should not try to start service1');
          }
        },
        {
          name: 'service2',
          runCommand: function(command) {
            Lab.expect(command).to.eql('start');
            done();
          }
        }
      ];

      var cli = Cli({
        service: {
          allServices: function() { return services; }
        }
      });

      cli._runCommand('start', 'service2');
    });
  });
});
