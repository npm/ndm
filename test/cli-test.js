require('../lib/config')({ headless: true }) // turn off output in tests.

const lab = require('lab')
const Lab = exports.lab = lab.script()
const expect = lab.expect
const Cli = require('../lib/cli')
const _ = require('lodash')

Lab.experiment('cli', function () {
  Lab.experiment('updateConfigWithArgs', function () {
    Lab.it("parses argument if there's a parser associated with the key", function (done) {
      const cli = Cli()

      cli.updateConfigWithArgs({
        sudo: 'false',
        globalPackage: true
      })

      const config = require('../lib/config')()

      expect(config.sudo).to.eql(false)
      expect(config.globalPackage).to.eql(true)

      done()
    })
  })

  Lab.experiment('updateConfigWithNpmconf', function () {
    Lab.it('should update modulePrefix with the npm install prefix', function (done) {
      const cli = Cli()
      const config = require('../lib/config')({
        modulePrefix: null
      })

      const npmconf = {
        get: function (prop) {
          if (prop === 'prefix') return './test/fixtures'
        }
      }

      cli.updateConfigWithNpmconf(npmconf)
      expect(config.modulePrefix).to.eql('./test/fixtures')

      done()
    })
  })

  Lab.experiment('generateArgs', function () {
    Lab.it('should generate options from config class', function (done) {
      const cli = Cli()

      cli.generateArgs()

      const help = cli.yargs.help()

      // generations option.
      expect(help).to.match(/-u/)
      // generates alias.
      expect(help).to.match(/-sudo/)
      // generates description.
      expect(help).to.match(/where does the node executable reside/)
      // generates defaults.
      expect(help).to.match(/default: .*service\.json/)

      done()
    })

    Lab.it('should generate list of possible usage commands', function (done) {
      const cli = Cli()

      cli.generateArgs()

      const help = cli.yargs.help()

      expect(help).to.match(/ndm generate/)

      done()
    })
  })

  Lab.experiment('help', function () {
    Lab.it('should print help if no arguments are given', function (done) {
      const cli = Cli({
        yargs: require('yargs')([]),
        logger: {
          log: function (str) {
            expect(str).to.match(/Usage:/)
            done()
          }
        }
      })

      cli.run()
    })

    Lab.it('should print help if --help is given', function (done) {
      const cli = Cli({
        yargs: require('yargs')(['generate', '--help']),
        logger: {
          log: function (str) {
            expect(str).to.match(/Usage:/)
            done()
          }
        }
      })

      cli.run()
    })

    Lab.it('should print help if command is not found', function (done) {
      const cli = Cli({
        yargs: require('yargs')(['foobar']),
        logger: {
          error: function (str) {},
          log: function (str) {
            expect(str).to.match(/Usage:/)
            done()
          }
        }
      })

      cli.run()
    })
  })

  Lab.experiment('execute', function () {
    Lab.it('should execute non-hyphenated option as command', function (done) {
      const cli = Cli({
        yargs: require('yargs')(['generate']),
        generate: function (serviceName) {
          expect(serviceName).to.be.undefined
          done()
        }
      })

      cli.run()
    })

    Lab.it('should pass additional non-hyphenated commands as args', function (done) {
      const cli = Cli({
        yargs: require('yargs')(['start', 'foobar']),
        start: function (serviceName) {
          expect(serviceName).to.eql('foobar')
          done()
        }
      })

      cli.run()
    })
  })

  Lab.experiment('_runCommand', function () {
    Lab.it('runs a command on all services, if no service name given', function (done) {
      // fake array of services for allServices.
      const services = [
        {
          name: 'service1',
          runCommand: function (command) {
            expect(command).to.eql('start')
          }
        },
        {
          name: 'service2',
          runCommand: function (command) {
            expect(command).to.eql('start')
            done()
          }
        }
      ]

      const cli = Cli({
        service: {
          allServices: function (serviceNameFilter) { return services }
        }
      })

      cli._runCommand('start')
    })

    Lab.it('runs a command on a single service if service name is given', function (done) {
      // fake array of services for allServices.
      const services = [
        {
          name: 'service1',
          runCommand: function (command) {
            throw Error('should not try to start service1')
          }
        },
        {
          name: 'service2',
          runCommand: function (command) {
            expect(command).to.eql('start')
            done()
          }
        }
      ]

      const cli = Cli({
        service: {
          allServices: function (serviceNameFilter) {
            return _.filter(services, function (service) { return service.name === serviceNameFilter })
          }
        }
      })

      cli._runCommand('start', 'service2')
    })
  })

  Lab.experiment('run-script', function () {
    Lab.it('runs a script on all services, if no service name given', function (done) {
      // fake array of services for allServices.
      const services = [
        {
          name: 'service1',
          hasScript: function () { return true },
          runScript: function (command) {
            expect(command).to.eql('foo-script')
          }
        },
        {
          name: 'service2',
          hasScript: function () { return true },
          runScript: function (command) {
            expect(command).to.eql('foo-script')
            done()
          }
        }
      ]

      const cli = Cli({
        service: {
          allServices: function () { return services }
        }
      })

      cli['run-script']('foo-script')
    })

    Lab.it('runs a script for a single service if service name is given', function (done) {
      require('../lib/config')({
        headless: true,
        filter: 'service2'
      })

      // fake array of services for allServices.
      const services = [
        {
          name: 'service1',
          runScript: function (command) {
            throw Error('should not try to start service1')
          }
        },
        {
          name: 'service2',
          hasScript: function () { return true },
          runScript: function (command) {
            expect(command).to.eql('foo-script')
            done()
          }
        }
      ]

      const cli = Cli({
        service: {
          allServices: function (serviceNameFilter) {
            return _.filter(services, function (service) { return service.name === serviceNameFilter })
          }
        }
      })

      cli['run-script']('foo-script')
    })
  })

  Lab.experiment('install', function () {
    Lab.it('runs an interview with a temporary service.json path', function (done) {
      // A mock Interview object.
      const FakeInterview = function (opts) {
        expect(opts.tmpServiceJsonPath).to.match(/.*\.json/)
        done()
      }
      FakeInterview.prototype.run = function () {}

      const cli = Cli({
        Interview: FakeInterview,
        service: {
          allServices: function () { return [] }
        }
      })

      cli.install()
    })

    Lab.it('generates service wrappers after running the interview', function (done) {
      // A mock Interview object.
      const FakeInterview = function () {}
      FakeInterview.prototype.run = function (cb) { cb() }

      const cli = Cli({
        Interview: FakeInterview,
        service: {
          printRunMessage: function () {},
          allServices: function () {
            return [{
              scriptPath: function () {},
              generateScript: function () {
                done() // we called generate script success!
              }
            }]
          }
        }
      })

      cli.install()
    })

    Lab.it('removes the temporary service.json once scripts are generated', function (done) {
      // A mock Interview object.
      let serviceJsonPath = null
      const FakeInterview = function (opts) {
        serviceJsonPath = opts.tmpServiceJsonPath
      }

      FakeInterview.prototype.run = function (cb) { cb() }

      const cli = Cli({
        rimraf: {
          sync: function (path) {
            expect(path).to.eql(serviceJsonPath)
            done()
          }
        },
        Interview: FakeInterview,
        service: {
          printRunMessage: function () {},
          allServices: function () {
            return [{
              scriptPath: function () {},
              generateScript: function () {}
            }]
          }
        }
      })

      cli.install()
    })
  })
})
