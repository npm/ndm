// common utilities, e.g., loading and parsing JSON.
var logger = require('./logger'),
  fs = require('fs'),
  exec = require('child_process').exec,
  spawn = require('child_process').spawn;

// load and parse the service JSON.
exports.loadServiceJson = function(path) {
  var services = null;

  try {
    services = fs.readFileSync(path).toString();
  } catch (e) {
    throw Error('could not load ' + path);
  }

  try {
    services = JSON.parse(services);
  } catch (e) {
    throw Error('invalid service.json, check file for errors.');
  }

  return services;
};

// write service.json back to disk.
exports.writeServiceJson = function(path, services) {
  try {
    fs.writeFileSync(path, JSON.stringify(services, null, '  '));
    logger.success('wrote ' + path + ' back to disk.')
  } catch (e) {
    throw Error('failed to write to ' + path);
  }
};

// actually exec a command, optionally as a super user.
exports.exec = function(command, cwd, cb) {
  // working directory is optional.
  if (typeof cwd === 'function') {
    cb = cwd;
    cwd = './';
  }

  var proc = spawn('sh', ['-c', command], {
    cwd: cwd,
    env: process.env,
    stdio: [process.stdin, null, null, null]
  });

  proc.stdout.on('data', function(data) {
    console.log(data);
  });

  proc.stderr.on('data', function(data) {
    logger.error('  ' + data.toString().trim());
  });

  proc.on('close', function(output) {
    cb();
  });
};
