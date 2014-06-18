# ndm


ndm makes it easy to deploy a complex service-oriented-architecture, by allowing you to deploy OS-specific service-wrappers directly from npm-packages.

ndm currently supports, Centos, OSX, and Ubuntu.

## Making a package work with ndm

* add a `service` stanza to your _package.json_, and specify the environment variables and command line arguments that your program requires:

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
      "PORT": 5000
    }
  },
}
```

* make sure you have a `bin` stanza in your _package.json_ which, this is the script that ndm will execute with node.

## The ndm directory structure

To deploy service wrappers using ndm you create a folder containing the following files:

* **package.json:** an npm package.json, with the `dependencies` stanza listing the various services that ndm will deploy.
* **service.json:** file, used to specify meta-information about the service being deployed.
  * **environment variables**
  * **command line arguments**
* **node_modules:** the services that ndm will execute, run `npm install` to populate the node modules directory.
* **logs:** the logs from your ndm service wrappers will be output here.

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

* **service-names:** the top-level keys in the _service.json_ represent the names of the services that you generate.
* **description:** description of the service.
* **env:** string environment variables available within the script executed by the ndm service wrapper.
* **args:** command-line-arguments available to the script executed by the ndm service wrapper.

## Generating service.json

Run `ndm init`, to generate _service.json_ from your installed npm dependencies.

Default values will be copied from the `service` in each services _package.json._

You can override these default settings by editing _service.json._

## Updating dependencies

To add new dependencies:

* run `npm install <service-name> --save`, to add the dependency to your package.json.
* run `ndm update`, to populate service.json with the service's default values.

## Installing service wrappers

* run `ndm generate`, to generate platform specific service wrappers.

## Starting services

* run `ndm start`, to start all installed services.
  * you can also manually using `upstart`, `launchctl`, or `initctl`.

## Stopping services

* run `ndm stop`

## Tailing logs

By default logs will be located in `./logs`.
