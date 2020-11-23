require('../../lib/config')({ headless: true }) // turn off output in tests.

const Centos = require('../../lib/platform-apis/centos')
const lab = require('lab')
const expect = lab.expect
const Lab = exports.lab = lab.script()

Lab.experiment('centos', function () {
  Lab.experiment('isPlatform', function () {
    Lab.it('should return true if releaseInfoFile contains the string Centos', function (done) {
      const centos = new Centos({
        releaseInfoFile: './test/fixtures/redhat-release'
      })
      expect(centos.isPlatform()).to.eql(true)
      done()
    })
  })
})
