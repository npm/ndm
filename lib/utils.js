// common utilities, e.g., loading and parsing JSON.
var logger = require('./logger'),
  fs = require('fs');

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
