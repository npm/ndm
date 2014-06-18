var Lab = require('lab'),
  Installer = require('../lib/').Installer,
  fs = require('fs'),
  rimraf = require('rimraf');

Lab.experiment('installer', function() {

  Lab.beforeEach(function(done) {
    rimraf.sync('./test/fixtures/service.json');
    rimraf.sync('./test/fixtures/logs');
    done();
  });

  Lab.after(function(done) {
    rimraf.sync('./test/fixtures/service.json');
    rimraf.sync('./test/fixtures/logs');
    done();
  });

  Lab.experiment('init', function() {

    Lab.it('should raise an exception if service.json already exists', function(done) {
      var installer = new Installer({
        baseWorkingDirectory: './'
      });

      Lab.expect(function() {
        installer.init();
      }).to.throw(Error, /service\.json already exists/);
      done();
    });

    Lab.it('should create a directory for logs', function(done) {
      var installer = new Installer({
        baseWorkingDirectory: './test/fixtures'
      });

      installer.init();
      done();
    });

    Lab.it('should add args and env stanzas copied from dependencies', function(done) {
      var installer = new Installer({
        baseWorkingDirectory: './test/fixtures'
      });

      installer.init();

      var serviceJson = JSON.parse(
        fs.readFileSync('./test/fixtures/service.json').toString()
      );

      Lab.expect(serviceJson['ndm-test'].description).to.eql('Test program for ndm deployment library.');
      Lab.expect(serviceJson['ndm-test'].env['PORT']).to.eql(5000);
      Lab.expect(serviceJson['ndm-test'].args['--verbose']).to.eql(false);

      done();
    });

    Lab.it('should raise an exception if package.json does not exist in the ndm directory', function(done) {
      var installer = new Installer({
        baseWorkingDirectory: './test'
      });

      Lab.expect(function() {
        installer.init();
      }).to.throw(Error, /package\.json did not exist/);
      done();
    });
  });
});
