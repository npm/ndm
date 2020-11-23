require('../lib/config')({ headless: true }) // turn off output in tests.

const lab = require('lab')
const Lab = exports.lab = lab.script()
const expect = lab.expect
const path = require('path')
const _ = require('lodash')

Lab.experiment('cli-self-install', function () {
  Lab.experiment('init', function () {
    Lab.it('should infer module name based on package.json', function (done) {
      const ndm = require('../lib')('ndm-test')
      expect(ndm.filter).to.eql('ndm-test')
      done()
    })

    Lab.it('should allow api opts to be overridden', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs'
      })
      expect(ndm.logsDirectory).to.eql('/foo/logs')
      done()
    })
  })

  Lab.experiment('calls methods on super-class', function () {
    Lab.it('executes super-class install', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        CliBase: {
          prototype: {
            install: function (filter) {
              expect(filter).to.eql('ndm-test')
              return done()
            }
          }
        }
      })
      ndm.install()
    })

    Lab.it('executes super-class list-scripts', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        'list-scripts': function (filter) {
          expect(filter).to.eql('ndm-test')
          return done()
        }
      })
      ndm.listScripts()
    })

    Lab.it('executes super-class run-script', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        'run-script': function () {
          return done()
        }
      })
      ndm.runScript()
    })

    Lab.it('executes super-class remove', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        CliBase: {
          prototype: {
            remove: function (filter) {
              expect(filter).to.eql('ndm-test')
              return done()
            }
          }
        }
      })
      ndm.remove()
    })

    Lab.it('executes super-class _runCommand', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        CliBase: {
          prototype: {
            _runCommand: function (command, filter) {
              expect(command).to.eql('foo')
              expect(filter).to.eql('ndm-test')
              return done()
            }
          }
        }
      })
      ndm._runCommand('foo')
    })
  })

  Lab.experiment('npmconf', function () {
    Lab.it('updates configuration with npmconf, when install is called', function (done) {
      const ndm = require('../lib')('ndm-test', {
        logsDirectory: '/foo/logs',
        updateConfigWithNpmconf: function (conf) {
          expect(typeof conf.get('prefix')).to.eql('string')
          return done()
        }
      })
      ndm.install()
    })
  })
})
