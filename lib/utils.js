// common utilities, e.g., loading and parsing JSON.
const logger = require('./logger')
const fs = require('fs')
const spawn = require('child_process').spawn
const path = require('path')

// load and parse the service JSON.
exports.loadServiceJson = function (path) {
  let services = null

  try {
    services = fs.readFileSync(path).toString()
  } catch (e) {
    throw Error('could not load ' + path)
  }

  try {
    services = JSON.parse(services)
  } catch (e) {
    throw Error('invalid json in ' + path + ', check file for errors.')
  }

  return services
}

// write service.json back to disk.
exports.writeServiceJson = function (path, services) {
  try {
    fs.writeFileSync(path, JSON.stringify(services, null, '  '))
    logger.success('wrote ' + path + ' to disk.')
  } catch (e) {
    throw Error('failed to write to ' + path)
  }
}

// actually exec a command, optionally as a super user.
exports.exec = function (command, cwd, cb) {
  // working directory is optional.
  if (typeof cwd === 'function') {
    cb = cwd
    cwd = './'
  }

  const proc = spawn('sh', ['-c', command], {
    cwd: cwd,
    env: process.env,
    stdio: [process.stdin, process.stdout, null]
  })

  proc.stderr.on('data', function (data) {
    logger.error('  ' + data.toString().trim())
  })

  proc.on('close', function (output) {
    cb()
  })
}

// resolve path, handling ~/ argument.
exports.resolve = function () { // (...)
  const args = Array.prototype.slice.call(arguments)

  // replace ~/ with absolute path.
  args[0] = args[0].replace('~/', process.env.HOME + '/')

  return path.resolve.apply(this, args)
}
