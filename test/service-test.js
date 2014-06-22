var Lab = require('lab'),
  path = require('path'),
  Service = require('../lib').Service,
  Config = require('../lib').Config,
  fs = require('fs');

Lab.experiment('service', function() {

  Lab.experiment('allServices', function() {
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

    Lab.it('should load the global args variable', function(done) {
      var service = Service.allServices()[1];
      Lab.expect(service.args).to.contain('--batman');
      Lab.expect(service.args).to.contain('greatest-detective');
      done();
    });
  });

  Lab.experiment('getService', function() {
    Lab.it('should return a single service based on its service name', function(done) {
      var service1 = Service.getService('ndm-test2'),
        service2 = Service.getService('ndm-test'),
        service3 = Service.getService('foobar');

      Lab.expect(service1.name).to.eql('ndm-test2');
      Lab.expect(service2.name).to.eql('ndm-test');
      Lab.expect(service3).to.be.undefined;
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
      // it should populate the bin for the script.
      Lab.expect(script).to.match(/\.\/test.js/)

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

        done();
      });

    });

    Lab.it('should raise an appropriate exception if JSON is invalid', function(done) {
      Config({
        platform: 'linux',
        daemonsDirectory: './',
        serviceJson: './test/fixtures/invalid-service.json'
      });

      Lab.expect(function() {
        var service = Service.allServices();
      }).to.throw(Error, /invalid service.json, check file for errors/);
      done();
    });

  });

});
