# ndm

ndm makes it easy to deploy a complex service-oriented-architecture, by allowing you to deploy OS-specific service-wrappers directly from npm-packages.

ndm currently supports, Centos, OSX, and Ubuntu.

## Installing

* `npm install ndm -g` (_depending on your OS, you may need to run `npm` as sudo._)

## Making a Package Work With ndm

* add a `service` stanza to your _package.json_, and specify the environment variables and command line arguments that your program requires (along with sane defaults):
* make sure you have a `bin` stanza in your _package.json_, this is the script that ndm will execute with node.

**a package.json that's ready for ndm:**

```json
{
  "name": "ndm-test",
  "version": "0.0.0",
  "description": "a service designed to be run with ndm.",
  "main": "index.js",
  "bin": "./bin/awesome.js",
  "author": "",
  "license": "ISC",
  "dependencies": {
    "ssh2": "^0.2.25"
  },
  "devDependencies": {
    "mocha": "^1.20.0"
  },
  "service": {
    "args": ["--verbose", "false"],
    "env": {
      "PORT": "5000"
    }
  },
}
```

## Quick Start

You can follow these steps, to get your services up and running with ndm:

* install ndm:
  * `sudo npm install ndm -g`
* create a project directory with a _package.json_:
  * `npm init`
* add service dependencies (see: _making a package work with ndm_), to your _package.json_.
  * `npm install service --save`
* generate your service.json:
  * `ndm init`.
* edit _service.json_, adding appropriate `args`, and `envs` for your server.
* when you're ready, generate service wrappers (upstart, initctl, etc):
  * `ndm generate`.
* to start the service wrappers you've just generated.
  * `ndm start`.

## The ndm Project Directory

You deploy your ndm services from within an ndm project directory. The project directory will tend to have the following files:

* **package.json:** an npm package.json, with the `dependencies` stanza listing the various services that ndm will deploy.
* **service.json:** used to specify meta-information about the service being deployed.
  * **environment variables**
  * **command line arguments**
* **node_modules:** the services that ndm will execute, run `npm install` to populate the node modules directory. ndm uses a modules folder in npm_modules as a working directory, when creating a service wrapper.
* **logs:** the logs from your ndm service wrappers will be output here.

## Generating service.json

Run `ndm init`, to generate _service.json_ from your installed npm dependencies.

Default values will be copied from the `service` stanza in each service's _package.json._

You can override these default settings by editing _service.json._

**an example service.json:**

```json
{
  "ndm-test": {
    "description": "thumbnailing service",
    "bin": "./test.js",
    "env": {
      "PORT": "8000",
      "USER": "bcoe"
    },
    "args": ["--kitten", "cute"]
  },
  "ndm-test2": {
    "module": "ndm-test",
    "bin": "./test.js",
    "module": "ndm-test",
    "env": {
      "PORT": "8080"
    }
  },
  "env": {
    "APP": "my-test-app"
  },
  "args": ["--batman", "greatest-detective"]
}
```

* **module:** the name of the npm module that should service as the working directory for the service.
  * if no module is specified, the key of the service will be used (it's assumed that the service _ndm-test_ runs within the _ndm-test_ module).
* **description:** description of the service.
* **bin:** the command to execute from the working directory, defaults to `bin` in _package.json._.
* **env:** string environment variables available within the script executed by the ndm service wrapper.
* **args:** command-line-arguments available to the script executed by the ndm service wrapper.

## Updating Dependencies

To add new dependencies:

* run `npm install <service-name> --save`, to add the dependency to your package.json.
* run `ndm update`, to populate service.json with the service's default values.

## Installing Service Wrappers

* run `ndm generate`, to generate platform specific service wrappers.

## Starting Services

* run `ndm start`, to start all installed services.
  * you can also manually using `upstart`, `launchctl`, or `initctl`.

## Stopping Services

* run `ndm stop`

## Tailing Logs

By default logs will be located in `./logs`.

## Disclaimer

* ndm is an experiment, based on ops challenges we've been facing at npm.
  * we'll be moving things around a lot in this library, as we use it for our own deployments.
  * the service stanza is not officially supported by npm.
