require('../lib/config')({headless: true}); // turn off output in tests.

var Lab = require('lab'),
  Interview = require('../lib').Interview;

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

});
