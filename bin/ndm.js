#!/usr/bin/env node

require('../lib/cli')().run();

// emit the appropriate exit code before shutting down.
process.on('exit', function() {
  if (require('../lib/logger').errorLogged()) process.exit(1);
  else process.exit(0);
});
