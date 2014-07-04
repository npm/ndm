// run a command in the context of the environment and
// args described in service.json.
var _ = require('lodash'),
  logger = require('./logger');

function Script(opts) {
  _.extend(this,
    {
    },
    require('./config')(),
    opts
  );
}

exports.module = Script;
