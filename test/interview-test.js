require('../lib/config')({headless: true}); // turn off output in tests.

var Lab = require('lab'),
  Interview = require('../lib').Interview,
  Installer = require('../lib/').Installer,
  rimraf = require('rimraf'),
  fs = require('fs');

Lab.experiment('interview', function() {

  Lab.experiment('_generateQuestions', function() {
    Lab.it('should generate interview questions from global args', function(done) {
      var interview = new Interview();

      interview._generateQuestions();

      Lab.expect(
        interview.questionLookup['--frontdoor-url'].message
      ).to.eql('url of front facing server');

      done();
    });

    Lab.it('should generate interview questions from global env', function(done) {
      var interview = new Interview();

      interview._generateQuestions();

      Lab.expect(
        interview.questionLookup['ENVIRONMENT'].message
      ).to.eql('what environment should we run the app in');

      done();
    });

    Lab.it('should generate interview questions from service args', function(done) {
      var interview = new Interview();

      interview._generateQuestions();

      // we handle two keys colliding by using a longer unique key.
      Lab.expect(
        interview.questionLookup['--dog'].message
      ).to.eql('what do you think of dogs?');

      done();
    });

    Lab.it('should generate interview questions from service env', function(done) {
      var interview = new Interview();

      interview._generateQuestions();

      // we handle two keys colliding by using a longer unique key.
      Lab.expect(
        interview.questionLookup['HOST'].message
      ).to.eql('what host should I bind to?');

      done();
    });

    Lab.it('should handle two variables colliding by using a longer unique value', function(done) {
      var interview = new Interview();

      interview._generateQuestions();

      // we handle two keys colliding by using a longer unique key.
      Lab.expect(
        interview.questionLookup['ndm-test:args:--frontdoor-url'].message
      ).to.eql('pork chop sandwiches');

      done();
    });
  });

  Lab.experiment('run', function() {

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

    Lab.it('persists service.json with answers to questions', function(done) {
      // generate the service.json.
      var installer = new Installer({
        baseWorkingDirectory: './test/fixtures',
        serviceJsonPath: './test/fixtures/service.json'
      });

      installer.init();

      // run the interview.
      var interview = new Interview({
        serviceJsonPath: './test/fixtures/service.json',
        inquirer: {
          prompt: function(questions, cb) {
            cb({
              overwrite: true,
              '--host': '2.2.2.2'
            })
          }
        }
      });

      interview.run(function() {});

      // validate the service.json written.
      var serviceJson = JSON.parse(
        fs.readFileSync('./test/fixtures/service.json').toString()
      );

      Lab.expect(serviceJson['ndm-test'].args['--host']).to.eql('2.2.2.2');

      done();
    });
  });

});
