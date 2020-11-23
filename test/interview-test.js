require('../lib/config')({ headless: true }) // turn off output in tests.

const lab = require('lab')
const Lab = exports.lab = lab.script()
const expect = lab.expect
const Interview = require('../lib/interview')
const Installer = require('../lib/installer')
const rimraf = require('rimraf')
const fs = require('fs')

Lab.experiment('interview', function () {
  Lab.experiment('_generateQuestions', function () {
    Lab.it('should generate interview questions from global args', function (done) {
      const interview = new Interview()

      interview._generateQuestions()

      expect(
        interview.questionLookup['--frontdoor-url'].message
      ).to.eql('url of front facing server')

      done()
    })

    Lab.it('should generate interview questions from global env', function (done) {
      const interview = new Interview()

      interview._generateQuestions()

      expect(
        interview.questionLookup.ENVIRONMENT.message
      ).to.eql('what environment should we run the app in')

      done()
    })

    Lab.it('should generate interview questions from service args', function (done) {
      const interview = new Interview()

      interview._generateQuestions()

      // we handle two keys colliding by using a longer unique key.
      expect(
        interview.questionLookup['--dog'].message
      ).to.eql('what do you think of dogs?')

      done()
    })

    Lab.it('should generate interview questions from service env', function (done) {
      const interview = new Interview()

      interview._generateQuestions()

      // we handle two keys colliding by using a longer unique key.
      expect(
        interview.questionLookup.HOST.message
      ).to.eql('what host should I bind to?')

      done()
    })

    Lab.it('should handle two variables colliding by using a longer unique value', function (done) {
      const interview = new Interview()

      interview._generateQuestions()

      // we handle two keys colliding by using a longer unique key.
      expect(
        interview.questionLookup['ndm-test:args:--frontdoor-url'].message
      ).to.eql('pork chop sandwiches')

      done()
    })

    Lab.describe('default values', function () {
      Lab.it('should load default values', function (done) {
        const interview = new Interview()

        interview._generateQuestions()

        // we handle two keys colliding by using a longer unique key.
        expect(
          interview.questionLookup.HOST.default
        ).to.eql('localhost')

        done()
      })

      Lab.it('should replace {{uuid}} with a GUID', function (done) {
        const interview = new Interview()

        interview._generateQuestions()

        // we handle two keys colliding by using a longer unique key.
        expect(
          interview.questionLookup.SECRET.default
        ).to.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)

        done()
      })
    })
  })

  Lab.experiment('run', function () {
    Lab.beforeEach(function (done) {
      rimraf.sync('./test/fixtures/service.json')
      rimraf.sync('./test/fixtures/logs');

      // generate the service.json.
      (new Installer({
        baseWorkingDirectory: './test/fixtures',
        serviceJsonPath: './test/fixtures/service.json'
      })).init()

      done()
    })

    Lab.after(function (done) {
      rimraf.sync('./test/fixtures/service.json')
      rimraf.sync('./test/fixtures/logs')
      done()
    })

    Lab.it('persists service.json with answers to questions', function (done) {
      // run the interview.
      const interview = new Interview({
        serviceJsonPath: './test/fixtures/service.json',
        inquirer: {
          prompt: function (questions, cb) {
            cb({
              overwrite: true,
              '--host': '2.2.2.2'
            })
          }
        }
      })

      interview.run(function () {})

      // validate the service.json written.
      const serviceJson = JSON.parse(
        fs.readFileSync('./test/fixtures/service.json').toString()
      )

      expect(serviceJson['ndm-test'].args['--host']).to.eql('2.2.2.2')

      done()
    })

    Lab.it('logs an error if no overwrite is falsy', function (done) {
      // run the interview.
      const interview = new Interview({
        logger: {
          error: function (msg) {
            expect(msg).to.eql('aborted writing service.json')
            done()
          }
        },
        serviceJsonPath: './test/fixtures/service.json',
        inquirer: {
          prompt: function (questions, cb) { cb({}) }
        }
      })

      interview.run(function () {})
    })

    Lab.it('if tmpServiceJsonPath given it does not prompt about overwriting', function (done) {
      // run the interview.
      const interview = new Interview({
        tmpServiceJsonPath: '/tmp/service.json',
        serviceJsonPath: './test/fixtures/service.json',
        inquirer: {
          prompt: function (questions, cb) {
            cb({
              '--host': '2.2.2.2'
            })
          }
        }
      })

      interview.run(function () {})
      done()
    })

    Lab.it('if tmpServiceJsonPath given outputs service.json to alternate location', function (done) {
      // run the interview.
      const interview = new Interview({
        tmpServiceJsonPath: '/tmp/service.json',
        serviceJsonPath: './test/fixtures/service.json',
        inquirer: {
          prompt: function (questions, cb) {
            cb({
              '--host': '2.2.2.2'
            })
          }
        }
      })

      interview.run(function () {})

      // validate the service.json written.
      const serviceJson = JSON.parse(
        fs.readFileSync('/tmp/service.json').toString()
      )

      expect(serviceJson['ndm-test'].args['--host']).to.eql('2.2.2.2')

      done()
    })
  })
})
