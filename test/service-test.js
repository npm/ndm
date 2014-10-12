require('../lib/config')({headless: true}); // turn off output in tests.

var _      = require('lodash'),
  Lab      = require('lab'),
  lab      = exports.lab = Lab.script(),
  describe = lab.describe,
  it       = lab.it,
  expect   = Lab.expect,
  path     = require('path'),
  Config   = require('../lib/config'),
  Service  = require('../lib/service'),
  fs       = require('fs');

lab.experiment('service', function() {

  lab.experiment('allServices', function() {
    it('returns all services if no filter is provided', function(done) {
      expect(Service.allServices().length).to.eql(3);
      done();
    });

    it('should filter a specific service if filter is argument is provided', function(done) {
      var services = Service.allServices('ndm'),
        service = services[0];

      expect(services.length).to.eql(1);
      expect(service.name).to.eql('ndm');

      done();
    });
  });

  lab.experiment('env', function() {
    it('should default module to service name, if no module stanza provided', function(done) {
      var service = Service.allServices()[0];
      expect(service.module).to.eql(service.name);
      done();
    });

    it('should allow npm-module to be overridden', function(done) {
      var service = Service.allServices()[1];
      expect(service.module).to.eql('ndm-test');
      done();
    });

    it('should load global environment stanza if present', function(done) {
      var service = Service.allServices()[1];
      expect(service.env.APP).to.eql('my-test-app');
      done();
    });

    it('should handle object rather than value for service env', function(done) {
      var service = Service.allServices()[1];
      expect(service.env.HOST).to.eql('localhost');
      done();
    });

    it('should handle object rather than value for global env', function(done) {
      var service = Service.allServices()[1];
      expect(service.env.ENVIRONMENT).to.eql('test');
      done();
    });
  });

  lab.experiment('args', function() {
    it('should load the global args variable', function(done) {
      var service = Service.allServices()[0];
      expect(service.args['--batman']).to.eql('greatest-detective');
      done();
    });

    it('should override global args with service specific args', function(done) {
      var service = Service.allServices()[0];
      expect(service.args['--dog']).to.eql('also-cute');
      done();
    });

    it('should handle an object rather than a value for service args', function(done) {
      var service = Service.allServices()[0];
      expect(service.args['--dog']).to.eql('also-cute');
      done();
    });

    it('should handle an object rather than a value for global args', function(done) {
      var service = Service.allServices()[2];
      expect(service.args['--frontdoor-url']).to.eql('http://127.0.0.1:8080');
      done();
    });

    lab.experiment('array arguments', function() {
      it('should handle array args', function(done) {
        var service = Service.allServices()[1];
        expect(service.args.indexOf('--apple')).to.be.gt(-1);
        done();
      });

      it('should combine global args with service level args', function(done) {
        Config({
          serviceJsonPath: './test/fixtures/args-service.json'
        });
        var service = Service.allServices()[0];
        expect(service.args[0]).to.eql('a');
        expect(service.args.indexOf("--apple")).to.not.eql(-1);
        done();
      });
    });
  });

  lab.experiment('multiple processes', function() {
    it('creates multiple services when processes value is set', function(done) {
      Config({
        serviceJsonPath: './test/fixtures/multi-process-service.json'
      });
      var services = Service.allServices(),
        serviceNames = _.map(services, function(service) {
          return service.name;
        });

      expect(services.length).to.eql(4);
      expect(serviceNames).to.include('awesome');
      expect(serviceNames).to.include('awesome-1');
      expect(serviceNames).to.include('awesome-2');
      expect(serviceNames).to.include('dude');
      done();
    });

    it('replaces %i with process count in env and args', function(done) {
      Config({
        serviceJsonPath: './test/fixtures/multi-process-service.json'
      });
      var services = Service.allServices(),
        service1 = services[0], // the multiple awesome services.
        service2 = services[1];
        service3 = services[3]; // the dude service.

      // %i replaced in env object.
      Lab.expect(service1.env.PORT).to.eql('5000');
      Lab.expect(service2.env.PORT).to.eql('5001');

      // %i replaced in args array.
      Lab.expect(service1.args).to.include('0');
      Lab.expect(service2.args).to.include('1');

      // %i replaced in args object.
      Lab.expect(service3.args['--port']).to.eql('8080');

      return done();
    });
  });

  lab.experiment('commands', function() {
    it('should generate appropriate start/stop/restart commands for OSX', function(done) {
      Config({
        platform: 'darwin',
        daemonsDirectory: './'
      });

      var service = Service.allServices()[0];

      service.execCommand = function(command, cb) {
        expect(command).to.match(/launchctl.*load.*/)
      };

      service.runCommand('start');

      service.execCommand = function(command, cb) {
        expect(command).to.match(/launchctl.*unload.*launchctl.*load/)
      };

      service.runCommand('restart');

      service.execCommand = function(command, cb) {
        expect(command).to.match(/launchctl.*unload.*/);
      };

      service.runCommand('stop');
      done();
    });

    it('should generate appropriate start/stop/restart commands for Centos', function(done) {
      Config({
        platform: 'centos',
        daemonsDirectory: './'
      });

      var service = Service.allServices()[0]

      service.execCommand = function(command, cb) {
        expect(command).to.eql("initctl start ndm-test");
      };

      service.runCommand('start');

      service.execCommand = function(command, cb) {
        expect(command).to.eql("initctl restart ndm-test");
      };

      service.runCommand('restart');

      service.execCommand = function(command, cb) {
        expect(command).to.eql("initctl stop ndm-test");
      };

      service.runCommand('stop');

      done();
    });

    it('should generate appropriate start/stop/restart commands for Ubuntu', function(done) {
      Config({
        platform: 'ubuntu',
        daemonsDirectory: './'
      });

      var service = Service.allServices()[0];

      service.execCommand = function(command, cb) {
        expect(command).to.eql("service ndm-test start");
      };

      service.runCommand('start');

      service.execCommand = function(command, cb) {
        expect(command).to.eql("service ndm-test restart");
      };

      service.runCommand('restart');

      service.execCommand = function(command, cb) {
        expect(command).to.eql("service ndm-test stop");
      };

      service.runCommand('stop');

      done();
    });

  });

  lab.experiment('generateScript', function() {

    function sharedAssertions(script) {
      // local environment variables populated.
      expect(script).to.match(/PORT/);
      expect(script).to.match(/8000/);

      // global environment variables populated.
      expect(script).to.match(/APP/)
      expect(script).to.match(/my-test-app/);

      // local args varibles populated.
      expect(script).to.match(/--kitten/);
      expect(script).to.match(/cute/);

      // global ags variables populated.
      expect(script).to.match(/--batman/);
      expect(script).to.match(/greatest-detective/);
    }

    lab.experiment('darwin', function() {
      it('should genterate a script with the appropriate variables populated', function(done) {
        // test generating a script for darwin.
        Config({
          platform: 'darwin',
          daemonsDirectory: './'
        });

        var service = Service.allServices()[0];

        service.generateScript(function() {
          // inspect the generated script, and make sure we've
          // populated the appropriate stanzas.
          var script = fs.readFileSync(service.scriptPath()).toString();

          sharedAssertions(script);

          // it should populate the bin for the script.
          expect(script).to.match(/>.\/test.js/)

          done();
        });

      });
    });

    lab.experiment('centos', function() {

      it('should genterate a script with the appropriate variables populated', function(done) {
        Config({
          platform: 'centos',
          daemonsDirectory: './'
        });

        var service = Service.allServices()[0]

        service.generateScript(function() {
          // inspect the generated script, and make sure we've
          // populated the appropriate stanzas.
          var script = fs.readFileSync(service.scriptPath()).toString();

          sharedAssertions(script);

          // we should not try to su.
          expect(script).to.not.match(/su -/);

          // it should populate the bin for the script.
          expect(script).to.match(/bin\/node \.\/test.js/)

          done();
        });

      });

      it('should switch su to uid user, if uid is provided', function(done) {
        Config({
          platform: 'centos',
          daemonsDirectory: './',
          uid: 'npm'
        });

        var service = Service.allServices()[0];

        service.generateScript(function() {
          // inspect the generated script, and make sure we've
          // populated the appropriate stanzas.
          var script = fs.readFileSync(service.scriptPath()).toString();

          sharedAssertions(script);

          // we should try to step down our privileges.
          expect(script).to.match(/su - npm/);

          done();
        });
      });

    });

    lab.experiment('ubuntu', function() {

      it('should genterate a script with the appropriate variables populated', function(done) {
        Config({
          platform: 'linux',
          daemonsDirectory: './'
        });

        var service = Service.allServices()[0]

        service.generateScript(function() {
          // inspect the generated script, and make sure we've
          // populated the appropriate stanzas.
          var script = fs.readFileSync(service.scriptPath()).toString();

          sharedAssertions(script);

          // it should populate the bin for the script.
          expect(script).to.match(/bin\/node \.\/test.js/)

          done();
        });
      });

    });

    it('should raise an appropriate exception if JSON is invalid', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './',
        serviceJsonPath: './test/fixtures/invalid-service.json'
      });

      expect(function() {
        var service = Service.allServices();
      }).to.throw(Error, /invalid service.json, check file for errors/);
      done();
    });

    it('should pass arguments after -- to generated script', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './'
      });

      Array.prototype.push.apply(process.argv, ['--', '--foovar', 'barvalue'])

      var service = Service.allServices()[0]

      service.generateScript(function() {
        // inspect the generated script, and make sure we've
        // populated the appropriate stanzas.
        var script = fs.readFileSync(service.scriptPath()).toString();

        sharedAssertions(script);

        // it should populate the bin for the script.
        expect(script).to.match(/--foovar barvalue/)

        done();
      });
    });

    it('should output an array of arguments appropriately to generated script', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './',
        serviceJsonPath: './test/fixtures/args-service.json'
      });

      var service = Service.allServices()[0];

      service.generateScript(function() {
        // inspect the generated script, and make sure we've
        // populated the appropriate stanzas.
        var script = fs.readFileSync(service.scriptPath()).toString();

        // it should populate the bin for the script.
        expect(script).to.match(/--spider-man sad/)

        done();
      });
    });

    it('should redirect stderr and stdout to log file by default', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './',
        serviceJsonPath: './test/fixtures/args-service.json'
      });

      var service = Service.allServices()[0];

      service.generateScript(function() {
        var script = fs.readFileSync(service.scriptPath()).toString();

        // it should redirect script output.
        expect(script).to.match(/>>.* 2>&1/);

        done();
      });
    });

    it('should allow stdout/stderr redirect to be overridden by console', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './',
        console: 'log',
        serviceJsonPath: './test/fixtures/args-service.json'
      });

      var service = Service.allServices()[0];

      service.generateScript(function() {
        var script = fs.readFileSync(service.scriptPath()).toString();

        expect(script).to.not.match(/>>.* 2>&1/);
        // it should use upstart's logging.
        expect(script).to.match(/console log/);

        done();
      });
    });

  });

  lab.experiment('removeScript', function() {

    it('should remove a generated script', function(done) {
      Config({
        platform: 'darwin',
        daemonsDirectory: './'
      });

      //generate a script so we have something to remove
      var service = Service.allServices()[0];

      service.generateScript(function() {
        service.removeScript(function() {
          var exists = fs.existsSync(service.scriptPath());

          // it should populate the bin for the script.
          expect(exists).to.eql(false)

          done();
        });
      });
    });
  });

  lab.experiment('listScripts', function() {
    it('should list scripts provided by service', function(done) {
      Config({
        headless: true,
        logger: {
          success: function(msg) {
            expect(msg).to.match(/foo/)
            done();
          }
        }
      });

      var service = Service.allServices()[0];

      service.listScripts();
    })
  });

  lab.experiment('hasScript', function() {
    it('returns true if a script exists corresponding to the name provided', function(done) {
      var service = Service.allServices()[0];
      expect(service.hasScript('foo')).to.eql(true);
      done();
    });

    it('returns false if a script does not exist corresponding to the name provided', function(done) {
      var service = Service.allServices()[0];
      expect(service.hasScript('bar')).to.eql(false);
      done();
    });
  });

  lab.experiment('runScript', function() {
    it('should execute matching script for service', function(done) {
      Config({
        headless: true,
        utils: {
          loadServiceJson: require('../lib/utils').loadServiceJson,
          resolve: path.resolve,
          exec: function(cmd, cb) {
            expect(cmd).to.match(/\.\/bin\/foo\.js/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

    it('should not explode if script does not exist', function(done) {
      Config({
        headless: true,
      });

      var service = Service.allServices()[0];
      service.runScript('banana', function() {
        done();
      });
    });

    it('should execute the script with the appropriate arguments', function(done) {
      Config({
        headless: true,
        utils: {
          loadServiceJson: require('../lib/utils').loadServiceJson,
          resolve: path.resolve,
          exec: function(cmd, cb) {
            expect(cmd).to.match(/--dog also-cute/);
            expect(cmd).to.match(/--batman greatest-detective/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

    it('should execute the script with environment variables prepended', function(done) {
      Config({
        headless: true,
        utils: {
          loadServiceJson: require('../lib/utils').loadServiceJson,
          resolve: path.resolve,
          exec: function(cmd, cb) {
            expect(cmd).to.match(/PORT="8000"/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

    it('should pass process.argv arguments to script', function(done) {
      Config({
        headless: true,
        utils: {
          loadServiceJson: require('../lib/utils').loadServiceJson,
          resolve: path.resolve,
          exec: function(cmd, cb) {
            expect(cmd).to.match(/--timeout 8000/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

  });

  lab.experiment('_startScript', function() {
    it('should remove node bin from the start script', function(done) {
      var service = Service.allServices()[0],
        startScript = service._startScript([]);

      expect(startScript).to.eql('./test.js');

      done();
    });

    it('should add arguments from scripts.start to flatArgs', function(done) {
      var service = Service.allServices()[0],
        args = ['foo'],
        startScript = service._startScript(args);

      expect(args[0]).to.eql('convert');
      expect(args).to.contain('foo');

      done();
    });
  });

  lab.experiment('_fixPath', function() {
    it('should replace ./ with absolute path to working directory', function(done) {
      var service = Service.allServices()[0];

      expect(service._fixPath('./foo')).to.eql(path.resolve('./foo'));
      expect(service._fixPath('bar=./foo')).to.eql('bar=' + path.resolve('./foo'));

      done();
    });

    it('should replace ~/ with absolute path to the home directory', function(done) {
      var service = Service.allServices()[0];

      expect(service._fixPath('~/foo')).to.eql(process.env['HOME'] + '/foo');
      expect(service._fixPath('bar=~/foo')).to.eql('bar=' + process.env['HOME'] + '/foo');

      done();
    });
  });

  lab.experiment('_workingDirectory', function() {
    it('uses ./node_modules/<service-name> if not self-referential module', function(done) {
      var service = Service.allServices()[0];
      expect(service.workingDirectory).to.match(/node_modules\/ndm-test/);
      done();
    });

    it('uses ./ if self-referential module', function(done) {
      var service = Service.allServices()[2];
      expect(service.workingDirectory).to.eql(path.resolve(__dirname, '../'));
      done();
    });
  });

  lab.experiment('_serviceJsonPath', function() {
    it('returns serviceJsonPath if it exists', function(done) {
      var expectedPath = path.resolve(__dirname, '../service.json'),
        config = Config({
          headless: true,
          serviceJsonPath: expectedPath,
        });

      expect(Service._serviceJsonPath()).to.eql(expectedPath);
      expect(config.logsDirectory).to.eql(config.defaultLogsDirectory());

      done();
    });

    it('returns package.json path if no service.json found', function(done) {
      var config = Config({
          headless: true,
          serviceJsonPath: path.resolve(__dirname, './fixtures/node_modules/@npm/ndm-test2/service.json')
        });

      expect(Service._serviceJsonPath()).to.eql(
        path.resolve(__dirname, './fixtures/node_modules/@npm/ndm-test2/package.json')
      );

      done();
    });

    it('finds service in ./node_modules if no service.json found elsewhere', function(done) {
      var config = Config({
        headless: true,
        serviceJsonPath: './bin/service.json', // path to service.json that does not exist.
      });

      expect(Service._serviceJsonPath('ndm-test')).to.match(/\/node_modules\/ndm-test\/service\.json/);
      expect(config.serviceJsonPath).to.match(/\/node_modules\/ndm-test\/service\.json/);
      expect(config.baseWorkingDirectory).to.match(/\/node_modules\/ndm-test/);

      done();
    });

    it('falls back to package.json from service.json when installing global module', function(done) {
      var config = Config({
        headless: true,
        serviceJsonPath: './bin/service.json', // path to service.json that does not exist.
      });

      expect(Service._serviceJsonPath('mocha')).to.match(/\/node_modules\/mocha\/package\.json/);
      expect(config.serviceJsonPath).to.match(/\/node_modules\/mocha\/package\.json/);
      expect(config.baseWorkingDirectory).to.match(/\/node_modules\/mocha/);

      done();
    });

    it('finds service in modulePrefix directory if no service.json found elsewhere', function(done) {
      var config = Config({
        headless: true,
        modulePrefix: './test/fixtures',
        serviceJsonPath: './bin/service.json', // path to service.json that does not exist.
      });

      expect(Service._serviceJsonPath('ndm-test')).to.match(
        /\/fixtures\/node_modules\/ndm-test\/service\.json/
      );
      expect(config.serviceJsonPath).to.match(
        /\/fixtures\/node_modules\/ndm-test\/service\.json/
      );
      done();
    });

    it('uses os logging directory if service is found using discovery', function(done) {
      var config = Config({
        headless: true,
        modulePrefix: './test/fixtures',
        serviceJsonPath: './bin/service.json', // path to service.json that does not exist.
      });

      Service._serviceJsonPath('ndm-test');

      expect(config.logsDirectory).to.eql(config.osLogsDirectory);
      done();
    });

    it('uses logging directory flag if an override is provided', function(done) {
      var config = Config({
        headless: true,
        logsDirectory: '/special/logs',
        modulePrefix: './test/fixtures',
        serviceJsonPath: './bin/service.json', // path to service.json that does not exist.
      });

      Service._serviceJsonPath('ndm-test');

      expect(config.logsDirectory).to.eql('/special/logs');
      done();
    });
  });

  lab.experiment('transformPackageJson', function() {

    it('can load a service from package.json rather than service.json', function(done) {
      var serviceJson = JSON.parse(fs.readFileSync(
        './node_modules/ndm-test/package.json', 'utf-8'
      ));

      var serviceJson = Service.transformPackageJson(serviceJson);

      expect(Object.keys(serviceJson)[0]).to.eql('ndm-test');
      expect(serviceJson['ndm-test'].scripts.start).to.eql('node ./test.js');

      done();
    });

  });

});
