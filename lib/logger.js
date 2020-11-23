const chalk = require('chalk')
const config = require('./config')()
let errorLogged = false

exports.log = function (message) {
  if (!config.headless) {
    console.log(message)
  }
}

exports.warn = function (message) {
  this.log(chalk.yellow(message))
}

exports.error = function (message) {
  errorLogged = true
  this.log(chalk.red(message))
}

exports.success = function (message) {
  this.log(chalk.green(message))
}

exports.errorLogged = function () {
  return errorLogged
}
