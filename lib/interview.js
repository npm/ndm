var _ = require('lodash'),
  inquirer = require('inquirer'),
  logger = require('./logger');

// ask the user to fill in any variables in
// the service.json of the form <description of value>.
function Interview(opts) {
  _.extend(this,
    {
      fs: require('fs')
    },
    require('./config')(),
    opts
  );
}

// Generate an array of questions in a format understood
// by inquirer from service.json.
//
// TODO: pull JSON loading into  shared utility.
Interview.prototype._generateQuestions = function() {
  var serviceJson = null,
    questions = [];

  // load and parse the serviceJson.
  try {
    serviceJson = this.fs.readFileSync(this.serviceJson).toString();
  } catch (e) {
    throw Error('could not load ' + this.serviceJson);
  }

  try {
    serviceJson = JSON.parse(serviceJson)
  } catch (e) {
    throw Error('invalid service.json, check file for errors.');
  }

  // generate questions from the global args object.
  Object.keys(serviceJson.args).forEach(function(key) {
    /*questions.push({
      name:
    });*/
  });
};

Interview.prototype._isQuestion = function(value) {
  return !!value.match(/<.*>/);
};

module.exports = Interview;
