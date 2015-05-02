var _ = require('lodash'),
  Service = require('./service'),
  utils = require('./utils'),
  uuid = require('node-uuid');

// ask the user to fill in any variables in
// the service.json of the form <description of value>.
function Interview(opts) {
  _.extend(this,
    {
      inquirer: require('inquirer'),
      questionLookup: {},
      logger: require('./logger'),
      services: null,
      // optionally we can output service.json
      // to a temporary file.
      tmpServiceJsonPath: null
    },
    require('./config')(),
    opts
  );

  this._loadServiceJson();
}

// load service.json handling special-case of
// reading configuration from package.json.
Interview.prototype._loadServiceJson = function() {
  this.services = utils.loadServiceJson(this.serviceJsonPath);

  // we appear to be loading a package.json.
  if (this.serviceJsonPath.indexOf('package.json') !== -1) {

    // convert package.json to service.json.
    this.services = Service.transformPackageJson(this.services);
  }
};

// run the interactive interview.
Interview.prototype.run = function(cb) {
  var _this = this;

  // generate questions from service.json.
  _this._generateQuestions();

  var questions = this._inquirerQuestions();

  this.inquirer.prompt(questions, function(answers) {
    if (!answers || _this.tmpServiceJsonPath || answers.overwrite) {
      _this._updateServiceVariables(answers);
    } else {
      _this.logger.error('aborted writing service.json')
    }
    cb();
  });
};

// update the stored services object with
// the answers to the interview.
Interview.prototype._updateServiceVariables = function(answers) {
  var _this = this;

  Object.keys(answers).forEach(function(answerKey) {
    var answer = answers[answerKey],
      question = _this.questionLookup[answerKey];

    if (question) question.parent[question.key] = answer;
  });

  utils.writeServiceJson(this.tmpServiceJsonPath || this.serviceJsonPath, this.services);
};

// generate questions in a form inquirer can use.
Interview.prototype._inquirerQuestions = function() {
  var _this = this,
    questions = [];

  Object.keys(this.questionLookup).forEach(function(name) {
    var question = {
      message: _this.questionLookup[name].message,
      name: name
    }

    // default values are optional.
    if (_this.questionLookup[name].default) question.default = _this.questionLookup[name].default;

    questions.push(question);
  });

  // confirm that the user actually wants to overwrite
  // service.json.
  if (!_this.tmpServiceJsonPath) {
    questions.push({
      name: 'overwrite',
      type: 'confirm',
      message: 'overwrite service.json with new values?'
    });
  }

  return questions;
};

// Generate a mapping of questions, convenient for
// prompting the user with inquirer, and for
// modifying the origina JSON.
Interview.prototype._generateQuestions = function() {
  var _this = this;

  // generate questions from the global args object.
  Object.keys(this.services.args || {}).forEach(function(arg) {
    _this._addQuestion('args:' + arg, _this.services.args);
  });

  // generate questions from the global env object.
  Object.keys(this.services.env || {}).forEach(function(env) {
    _this._addQuestion('env:' + env, _this.services.env);
  });

  // now generate interview questions for each service.
  Object.keys(this.services).forEach(function(key) {
    if (key === 'args' || key === 'env') return;

    // add questions pulled from args.
    Object.keys(_this.services[key].args || {}).forEach(function(arg) {
      _this._addQuestion(key + ':args:' + arg, _this.services[key].args);
    });

    // add questions pulled from env.
    Object.keys(_this.services[key].env || {}).forEach(function(env) {
      _this._addQuestion(key + ':env:' + env, _this.services[key].env);
    });
  });
};

// check whether a question should be interviewed for
// and add to questions array.
Interview.prototype._addQuestion = function(uniqueKey, parent) {
  var key = uniqueKey.split(':').pop(),
    value = parent[key];

  if (typeof value === 'object') {
    // this key did not collide, we do not need
    // to namespace it.
    if (!this.questionLookup[key]) uniqueKey = key;

    this.questionLookup[uniqueKey] = {
      key: key, // key to modify in original JSON.
      parent: parent, // node in original JSON to modify,
      message: value.description, // description for inquirer.
      default: (value.default || '').replace('{{uuid}}', uuid.v4()) // default value to display.
    };
  };
};

module.exports = Interview;
