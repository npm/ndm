# ndm

[![Build Status](https://travis-ci.org/npm/ndm.png)](https://travis-ci.org/npm/ndm)

ndm makes it easy to deploy a complex service-oriented-architecture by allowing you to deploy OS-specific service-wrappers directly from an npm package.

ndm currently supports Centos, OS X, and Ubuntu.

**Table of Contents:**

* [Installation](#install)
* [What's service.json?](#servicejson)
* [Getting Information From Your User](#interview)
* [ndm API (create self-installing packages)](#api)

## Installing <a name="install"></a>

* `npm install ndm -g`

You might need to run that as root with `sudo`.

## Quick Start

How to build an ndm-ready package:

1. Install ndm: `sudo npm install ndm -g`
2. Create a project directory with a _package.json_: `npm init`
3. Add service dependencies to your _package.json_: `npm install my-service-module --save`
4. Generate your service.json: `ndm init`.
5. Edit _service.json_ to add appropriate `args` and `envs` for your server.
6. When you're ready, generate service wrappers (upstart, initctl, etc): `ndm install`.
7. Start the service wrappers you've just generated: `ndm start`.

## Anatomy of an ndm service

ndm can run a single services or a collection of services. It's structured like an npm package, with a **package.json** file listing its dependencies. Each service you want to run with ndm should be packaged as its own separate npm module that the ndm wrapper depends on. Then a **service.json** file describes how to run each service.

An ndm wrapper package looks like this:

    wrapper/
      package.json
      service.json
      logs/
      node_modules/

### Service dependencies

A node-packaged service built for ndm can provide some hints in its package.json about how to run itself. Here's an example ndm-ready **package.json**:

```json
{
  "name": "be-awesome",
  "version": "0.0.0",
  "description": "a service designed to be run with ndm.",
  "main": "index.js",
  "author": "",
  "license": "ISC",
  "dependencies": {
    "ssh2": "^0.2.25"
  },
  "devDependencies": {
    "mocha": "^1.20.0"
  },
  "script": {
    "start": "node ./bin/awesome.js"
  },
  "service": {
    "args": {
      "--verbose": "false"
    },
    "env": {
      "PORT": "5000"
    }
  },
}
```

Note the `environment` field and its subfields. `environment.args` is a map of arguments that should be passed to the ndm service. `ndm.env` is a map of environment variables that should be passed to your ndm service.

### The `service.json` file <a name="servicejson"></a>

The ndm wrapper must also have a **service.json** file, which describes how to run the services. Run `ndm init` to generate _service.json_ from your installed npm dependencies. The init script will copy default values from the `environment` stanza in each service's **package.json**. You can then edit the defaults if you need to change anything.

Here's an example:

```json
{
  "baby-animals": {
    "description": "baby animal thumbnailing service",
    "scripts": {
      "start": "./baby-animal.js"
    },
    "env": {
      "PORT": "8000",
      "USER": "bcoe"
    },
    "args": {
      "--kitten": "cute"
    }
  },
  "ndm-test2": {
    "description": "the awesome service",
    "processes": 3,
    "module": "be-awesome",
    "scripts": {
      "start": "./bin/foo.js"
    },
    "env": {
      "PORT": "5000"
    },
    "args": {
      "--verbose": "false"
    }
  },
  "env": {
    "APP": "my-test-app-%i",
    "NODE_ENV": "production"
  },
  "args": {
    "--batman": "greatest-detective"
  }
}
```

* **module:** the name of the npm module that should be the working directory for the service. If no module is specified, the key of the service will be used as the module name to look for.
* **description:** description of the service.
* **scripts:** scripts that can be executed by ndm. When generating service wrappers the `start` script is used.
* **env:** string environment variables available within the script executed by the ndm wrapper.
* **args:** command-line-arguments available to the script executed by the ndm wrapper.
* **processes:** how many copies of the service should be run.
  * useful for taking advantage of multiple cpus, defaults to 1 process.
* **`%i`:** `%i` is a place-holder for the process # if you're running multiple processes.
  * this can be useful if you want each process to bind to a different port, e.g., `800%i`.

Defaults for all services are in the top-level `env` and `args` fields. Each services can override and extend the defaults in its own options stanza.

### Updating dependencies

To add new dependencies:

* Add a new dependency to the wrapper's **package.json** the way you would for any npm package:<br> `npm install <new-service> --save`
* Add the new service to **service.json**:<br>`ndm update`.

## Installing the services

To install your ndm-wrapped services, copy the package directory to your host system using whatever means you prefer. Then from inside the directory, run `ndm install`.

On systems like Ubuntu, you'll need to run this as root so ndm has permission to add the upstart config file to `/etc/init`. On OS X, you can run it as any user to create a local launch control script.

Command line arguments can be passed to the service wrapper at generation time, by appending them after `--`:

```bash
ndm install -- --verbose true
```

## Starting and stopping

You can start and stop the services manually using your host's native daemon control: `upstart`, `launchctl`, or `initctl`. Or you can use `ndm start` and `ndm stop` from inside an ndm wrapper directory to start & stop all the wrapped services.

## Tailing Logs

All console.log and console.error output is recorded in the `logs/` directory, in files named `<service-name>.log`. This is separate from whatever internally-managed logging the service might do.

## Interviewing the User <a name="interview"></a>

Rather than providing set-in-stone default values, you can opt to interview your user. To interview a user for important variables, write your default values in this form:

```json
"env": {
  "HOST": {
    "default": "localhost",
    "description": "what host should I bind to?"
  }
}
```

By running `ndm interview`, a user will then be asked to fill in these values in an interactive manner:

```bash
Benjamins-MacBook-Air:ndm benjamincoe$ node ./bin/ndm.js interview
starting interview:
[?] url of front facing server: www.example.com
[?] what environment should we run the app in: test
[?] what do you think of dogs? I like 'em.
```

## .ndmrc

Add an `.ndmrc` file to your home directory, to override ndm's default settings.

Variable names should be camel-case. As an example, the following `.ndmrc` would change the default logging location:

```ini
; override ndm CLI variables by adding
; them to a .ndmrc file. Variables should be
; cammel case.
logsDirectory=/foo/bar/logs
```

## The ndm API <a name="api"></a>

Rather than using the ndm bin to manage services, you can use the ndm API to create a self-installable service:

1. add ndm to your package.json dependencies.
2. add a service.json to the root of your module with a scripts stanza which includes:
  * a `start` script, which is what ndm will run by default.
  * any other scripts that you'd like to expose via `runScript`.

**service.json example:**

```json
{
  "ndm-test": {
    "description": "ndm test service",
    "scripts": {
      "start": "node ./test.js",
      "echo": "echo hello",
      "node-echo": "node ./test2.js"
    },
    "env": {
      "PORT": 8000,
      "USER": {
        "description": "enter a username."
      }
    }
  }
}
```

3. update your package's bin to look something like this (the argument passed to ndm's require is the name of the module in the service.json that you'd like to run):

```
#!/usr/bin/env node

var argv = require('yargs').argv,
  ndm = require('ndm')('ndm-test');

switch(argv._[0]) {
  case 'install':
    ndm.install();
    break;
  case 'remove':
    ndm.remove();
    break;
  case 'start':
    ndm.start();
    break;
  case 'restart':
    ndm.restart();
    break;
  case 'stop':
    ndm.stop();
    break;
  case 'list-scripts':
    ndm.listScripts();
    break;
  case 'run-script':
    ndm.runScript();
    break;
}
```

ndm-test is published to npm, try it out:

```bash
npm install ndm-test -g
ndm-test install
ndm-test start
```

## Setting Node Flags

For each service in your service.json file, you can optionally set the following flags.

* `maxOldSpaceSize`: sets the `--max-old-space-size` flag to to `N` megabytes.

```json
{
  "foo": {
    "maxOldSpaceSize": "4096"
  }
}
```

## Disclaimer

ndm is an experiment, based on ops challenges we've been facing at npm. This is a dot release. I'll be moving things around a lot in this library, as we use it for our own deployments.

The `ndm` stanza is not officially supported by npm.

## LICENSE

ISC
