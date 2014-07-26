require('../lib/config')({headless: true}); // turn off output in tests.

var Lab = require('lab'),
  path = require('path'),
  Config = require('../lib').Config,
  Service = require('../lib').Service,
  fs = require('fs');

Lab.experiment('service', function() {

  Lab.experiment('env', function() {
    Lab.it('should default module to service name, if no module stanza provided', function(done) {
      var service = Service.allServices()[0];
      Lab.expect(service.module).to.eql(service.name);
      done();
    });

    Lab.it('should allow npm-module to be overridden', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.module).to.eql('ndm-test');
      done();
    });

    Lab.it('should load global environment stanza if present', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.env.APP).to.eql('my-test-app');
      done();
    });

    Lab.it('should handle object rather than value for service env', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.env.HOST).to.eql('localhost');
      done();
    });

    Lab.it('should handle object rather than value for global env', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.env.ENVIRONMENT).to.eql('test');
      done();
    });
  });

  Lab.experiment('args', function() {
    Lab.it('should load the global args variable', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.args['--batman']).to.eql('greatest-detective');
      done();
    });

    Lab.it('should override global args with service specific args', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.args['--spider-man']).to.eql('sad');
      done();
    });

    Lab.it('should handle array args', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.args['--apple']).to.eql('banana');
      done();
    });

    Lab.it('should handle flags, without creating undefined arguments', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.args.awesome).to.not.be.undefined;
      done();
    });

    Lab.it('should handle an object rather than a value for service args', function(done) {
      var service = Service.allServices()[0];
      Lab.expect(service.args['--dog']).to.eql('also-cute');
      done();
    });

    Lab.it('should handle an object rather than a value for global args', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.args['--frontdoor-url']).to.eql('http://127.0.0.1:8080');
      done();
    });
  });

  Lab.experiment('commands', function() {
    Lab.it('should generate appropriate start/stop/restart commands for OSX', function(done) {
      Config({
        platform: 'darwin',
        daemonsDirectory: './'
      });

      var service = Service.allServices()[0]
      Lab.expect(service._startCommand()).to.match(/launchctl.*load.*/)
      Lab.expect(service._restartCommand()).to.match(/launchctl.*unload.*launchctl.*load/)
      Lab.expect(service._stopCommand()).to.match(/launchctl.*unload.*/)

      done();
    });

    Lab.it('should generate appropriate start/stop/restart commands for Centos', function(done) {
      Config({
        platform: 'centos',
        daemonsDirectory: './'
      });

      var service = Service.allServices()[0]
      Lab.expect(service._startCommand()).to.eql("initctl start ndm-test")
      Lab.expect(service._restartCommand()).to.eql("initctl restart ndm-test")
      Lab.expect(service._stopCommand()).to.eql("initctl stop ndm-test")

      done();
    });

    Lab.it('should generate appropriate start/stop/restart commands for Ubuntu', function(done) {
      Config({
        platform: 'ubuntu',
        daemonsDirectory: './'
      });

      var service = Service.allServices()[0]
      Lab.expect(service._startCommand()).to.eql("service ndm-test start")
      Lab.expect(service._restartCommand()).to.eql("service ndm-test restart")
      Lab.expect(service._stopCommand()).to.eql("service ndm-test stop")

      done();
    });

  });

  Lab.experiment('generateScript', function() {

    function sharedAssertions(script) {
      // local environment variables populated.
      Lab.expect(script).to.match(/PORT/);
      Lab.expect(script).to.match(/8000/);

      // global environment variables populated.
      Lab.expect(script).to.match(/APP/)
      Lab.expect(script).to.match(/my-test-app/);

      // local args varibles populated.
      Lab.expect(script).to.match(/--kitten/);
      Lab.expect(script).to.match(/cute/);

      // global ags variables populated.
      Lab.expect(script).to.match(/--batman/);
      Lab.expect(script).to.match(/greatest-detective/);
    }

    Lab.experiment('darwin', function() {
      Lab.it('should genterate a script with the appropriate variables populated', function(done) {
        // test generating a script for darwin.
        Config({
          platform: 'darwin',
          daemonsDirectory: './'
        });

        var service = Service.allServices()[0]
        service.generateScript();

        // inspect the generated script, and make sure we've
        // populated the appropriate stanzas.
        var script = fs.readFileSync(service.scriptPath()).toString();

        sharedAssertions(script);

        // it should populate the bin for the script.
        Lab.expect(script).to.match(/>.\/test.js/)

        done();
      });
    });

    Lab.experiment('centos', function() {

      Lab.it('should genterate a script with the appropriate variables populated', function(done) {
        Config({
          platform: 'centos',
          daemonsDirectory: './'
        });

        var service = Service.allServices()[0]
        service.generateScript();

        // inspect the generated script, and make sure we've
        // populated the appropriate stanzas.
        var script = fs.readFileSync(service.scriptPath()).toString();

        sharedAssertions(script);

        // we should not try to su.
        Lab.expect(script).to.not.match(/su -/);

        // it should populate the bin for the script.
        Lab.expect(script).to.match(/bin\/node \.\/test.js/)

        done();
      });

      Lab.it('should switch su to uid user, if uid is provided', function(done) {
        Config({
          platform: 'centos',
          daemonsDirectory: './',
          uid: 'npm'
        });

        var service = Service.allServices()[0]
        service.generateScript();

        // inspect the generated script, and make sure we've
        // populated the appropriate stanzas.
        var script = fs.readFileSync(service.scriptPath()).toString();

        sharedAssertions(script);

        // we should try to step down our privileges.
        Lab.expect(script).to.match(/su - npm/);

        done();
      });

    });

    Lab.experiment('linux', function() {

      Lab.it('should genterate a script with the appropriate variables populated', function(done) {
        Config({
          platform: 'linux',
          daemonsDirectory: './'
        });

        var service = Service.allServices()[0]
        service.generateScript();

        // inspect the generated script, and make sure we've
        // populated the appropriate stanzas.
        var script = fs.readFileSync(service.scriptPath()).toString();

        sharedAssertions(script);

        // it should populate the bin for the script.
        Lab.expect(script).to.match(/bin\/node \.\/test.js/)

        done();
      });

    });

    Lab.it('should raise an appropriate exception if JSON is invalid', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './',
        serviceJsonPath: './test/fixtures/invalid-service.json'
      });

      Lab.expect(function() {
        var service = Service.allServices();
      }).to.throw(Error, /invalid service.json, check file for errors/);
      done();
    });

  });

  Lab.experiment('removeScript', function() {

    Lab.it('should remove a generated script', function(done) {
      Config({
        platform: 'darwin',
        daemonsDirectory: './'
      });

      //generate a script so we have something to remove
      var service = Service.allServices()[0]
      service.generateScript();

      service.removeScript();

      var exists = fs.existsSync(service.scriptPath());

      // it should populate the bin for the script.
      Lab.expect(exists).to.eql(false)

      done();
    });
  });

  Lab.experiment('listScripts', function() {
    Lab.it('should list scripts provided by service', function(done) {
      Config({
        headless: true,
        logger: {
          success: function(msg) {
            Lab.expect(msg).to.match(/foo/)
            done();
          }
        }
      });

      var service = Service.allServices()[0];

      service.listScripts();
    })
  });

  Lab.experiment('hasScript', function() {
    Lab.it('returns true if a script exists corresponding to the name provided', function(done) {
      var service = Service.allServices()[0];
      Lab.expect(service.hasScript('foo')).to.eql(true);
      done();
    });

    Lab.it('returns false if a script does not exist corresponding to the name provided', function(done) {
      var service = Service.allServices()[0];
      Lab.expect(service.hasScript('bar')).to.eql(false);
      done();
    });
  });

  Lab.experiment('runScript', function() {
    Lab.it('should execute matching script for service', function(done) {
      Config({
        headless: true,
        utils: {
          resolve: path.resolve,
          exec: function(cmd, cb) {
            Lab.expect(cmd).to.match(/\.\/bin\/foo\.js/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

    Lab.it('should not explode if script does not exist', function(done) {
      Config({
        headless: true,
      });

      var service = Service.allServices()[0];
      service.runScript('banana', function() {
        done();
      });
    });

    Lab.it('should execute the script with the appropriate arguments', function(done) {
      Config({
        headless: true,
        utils: {
          resolve: path.resolve,
          exec: function(cmd, cb) {
            Lab.expect(cmd).to.match(/--dog also-cute/);
            Lab.expect(cmd).to.match(/--batman greatest-detective/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

    Lab.it('should execute the script with environment variables prepended', function(done) {
      Config({
        headless: true,
        utils: {
          resolve: path.resolve,
          exec: function(cmd, cb) {
            Lab.expect(cmd).to.match(/PORT="8000"/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

    Lab.it('should pass process.argv arguments to script', function(done) {
      Config({
        headless: true,
        utils: {
          resolve: path.resolve,
          exec: function(cmd, cb) {
            Lab.expect(cmd).to.match(/--timeout=8000/);
            done();
          }
        }
      });

      var service = Service.allServices()[0];
      service.runScript('foo');
    });

  });

  Lab.experiment('_startScript', function() {
    Lab.it('should remove node bin from the start script', function(done) {
      var service = Service.allServices()[0],
        startScript = service._startScript([]);

      Lab.expect(startScript).to.eql('./test.js');

      done();
    });

    Lab.it('should add arguments from scripts.start to flatArgs', function(done) {
      var service = Service.allServices()[0],
        args = ['foo'],
        startScript = service._startScript(args);

      Lab.expect(args[0]).to.eql('convert');
      Lab.expect(args).to.contain('foo');

      done();
    });
  });

  Lab.experiment('_fixPath', function() {
    Lab.it('should replace ./ with absolute path to working directory', function(done) {
      var service = Service.allServices()[0];

      Lab.expect(service._fixPath('./foo')).to.eql(path.resolve('./foo'));
      Lab.expect(service._fixPath('bar=./foo')).to.eql('bar=' + path.resolve('./foo'));

      done();
    });

    Lab.it('should replace ~/ with absolute path to the home directory', function(done) {
      var service = Service.allServices()[0];

      Lab.expect(service._fixPath('~/foo')).to.eql(process.env['HOME'] + '/foo');
      Lab.expect(service._fixPath('bar=~/foo')).to.eql('bar=' + process.env['HOME'] + '/foo');

      done();
    });
  });

});
