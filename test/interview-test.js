require('../lib/config')({headless: true}); // turn off output in tests.

var Lab = require('lab'),
  Interview = require('../lib').Interview;

Lab.experiment('interview', function() {

  Lab.experiment('_generateQuestions', function() {
    Lab.it('should generate interview questions from global args', function(done) {
      var interview = new Interview(),
        questions = interview._generateQuestions();

      done();
    });
  });

});
