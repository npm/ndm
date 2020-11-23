require('../../lib/config')({ headless: true }) // turn off output in tests.

const PlatformBase = require('../../lib/platform-apis/platform-base').PlatformBase
const lab = require('lab')
const expect = lab.expect
const Lab = exports.lab = lab.script()

Lab.experiment('platform-base', function () {
  Lab.experiment('restart', function () {
    Lab.it('should call stop', function (done) {
      const platform = new PlatformBase({
        logger: {
          error: function (msg) {
            expect(msg).to.eql('must implement stop()')
            done()
          }
        }
      })

      platform.restart('fake-service', function () {})
    })

    Lab.it('should call start', function (done) {
      const platform = new PlatformBase({
        stop: function (service, cb) {
          return cb()
        }
      })

      platform.restart('fake-service', function (err) {
        expect(err.message).to.eql('must implement start()')
        done()
      })
    })
  })
})
