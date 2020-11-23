const _ = require('lodash')
const lab = require('lab')
const Lab = exports.lab = lab.script()
const expect = lab.expect
const path = require('path')
const Centos = require('../lib/platform-apis/centos')
const Config = require('../lib/config')
const util = require('util')

Lab.experiment('config', function () {
  Lab.it('should be initialized with sane defaults', function (done) {
    const config = Config()
    expect(config.baseWorkingDirectory).to.match(/ndm/)
    done()
  })

  Lab.it('should allow defaults to be overridden by opts', function (done) {
    const config = Config({
      baseWorkingDirectory: '/banana'
    })
    expect(config.baseWorkingDirectory).to.eql('/banana')
    done()
  })

  Lab.it('should allow defaults to be overridden by environment variables', function (done) {
    const config = Config({
      env: { NDM_BASE_WORKING_DIRECTORY: '/foo' }
    }, true)
    expect(config.baseWorkingDirectory).to.eql('/foo')
    done()
  })

  Lab.it('should set OS specific environment variables', function (done) {
    const config = Config({
      platform: 'darwin'
    }, true)
    config.updateWithOSDefaults()
    expect(config.daemonsDirectory).to.eql('~/Library/LaunchAgents/')
    done()
  })

  Lab.it('should allow OS specific variables to be overridden', function (done) {
    const config = Config({
      platform: 'darwin',
      daemonsDirectory: '/foo'
    })
    expect(config.daemonsDirectory).to.eql('/foo')
    done()
  })

  Lab.it('should behave as a singleton once initialized', function (done) {
    Config({
      platform: 'banana'
    })

    const config = (require('../lib/config'))()

    expect(config.platform).to.eql('banana')
    done()
  })

  Lab.it('should allow isPlatform to override the platform reported by os.platform()', function (done) {
    // Create a special Centos platform API
    // for testing purposes.
    const C = function () {
      this.platform = 'centos'
      this.releaseInfoFile = './test/fixtures/redhat-release'
    }
    C.configOverrides = {}
    util.inherits(C, Centos)

    // Use this mock in our Config.
    const config = Config({
      platformApis: {
        centos: C
      }
    }, true)

    expect(config.platform).to.eql('centos')
    done()
  })

  Lab.it('should read .ndmrc, and allow default settings to be overridden', function (done) {
    const config = Config()
    expect(config.releaseInfoFile).to.eql('/foo/bar/release')
    done()
  })
})
