# ndm

ndm makes it easy to deploy a complex service-oriented-architecture by allowing you to deploy OS-specific service-wrappers directly from an npm package.

ndm currently supports Centos, OS X, and Ubuntu.

## Installing

* `npm install ndm -g`

You might need to run that as root with `sudo`.

## Quick Start

How to build an ndm-ready package:

1. Install ndm: `sudo npm install ndm -g`
2. Create a project directory with a _package.json_: `npm init`
3. Add service dependencies to your _package.json_: `npm install my-service-module --save`
4. Generate your service.json: `ndm init`.
5. Edit _service.json_ to add appropriate `args` and `envs` for your server.
6. When you're ready, generate service wrappers (upstart, initctl, etc): `ndm generate`.
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
  "bin": {
    "awesome": "./bin/awesome.js"
  },
  "ndm": {
    "bin": "awesome",
    "args": ["--verbose", "false"],
    "env": {
      "PORT": "5000"
    }
  },
}
```

Note the `ndm` field and its subfields. `ndm.bin` names the bin script to run to start this service. `ndm.args` is an array listing command-line arguments. `ndm.env` is an object mapping environment variable names to values.

### The `service.json` file

The ndm wrapper must also have a **service.json** file, which describes how to run the services. Run `ndm init` to generate _service.json_ from your installed npm dependencies. The init script will copy default values from the `ndm` stanza in each service's **package.json**. You can then edit the defaults if you need to change anything.

Here's an example:

```json
{
  "baby-animals": {
    "description": "baby animal thumbnailing service",
    "bin": "./baby-animal.js",
    "env": {
      "PORT": "8000",
      "USER": "bcoe"
    },
    "args": ["--kitten", "cute"]
  },
  "ndm-test2": {
    "description": "the awesome service",
    "module": "be-awesome",
    "bin": "awesome",
    "env": {
      "PORT": "5000"
    },
    "args": ["--verbose", "false"]
  },
  "env": {
    "APP": "my-test-app",
    "NODE_ENV": "production"
  },
  "args": ["--batman", "greatest-detective"]
}
```

* **module:** the name of the npm module that should be the working directory for the service. If no module is specified, the key of the service will be used as the module name to look for.
* **description:** description of the service.
* **bin:** the command to execute from the working directory; defaults to the value of the `ndm.bin` field in the service's **package.json**.
* **env:** string environment variables available within the script executed by the ndm wrapper.
* **args:** command-line-arguments available to the script executed by the ndm wrapper.

Defaults for all services are in the top-level `env` and `args` fields. Each services can override and extend the defaults in its own options stanza.

### Updating dependencies

To add new dependencies:

* Add a new dependency to the wrapper's **package.json** the way you would for any npm package:<br> `npm install <new-service> --save`
* Add the new service to **service.json**:<br>`ndm update`.

## Installing the services

To install your ndm-wrapped services, copy the package directory to your host system using whatever means you prefer. Then from inside the directory, run `ndm generate`.

On systems like Ubuntu, you'll need to run this as root so ndm has permission to add the upstart config file to `/etc/init`. On OS X, you can run it as any user to create a local launch control script.

## Starting and stopping

You can start and stop the services manually using your host's native daemon control: `upstart`, `launchctl`, or `initctl`. Or you can use `ndm start` and `ndm stop` from inside an ndm wrapper directory to start & stop all the wrapped services.

## Tailing Logs

All console.log and console.error output is recorded in the `logs/` directory, in files named `<service-name>.log`. This is separate from whatever internally-managed logging the service might do.

## Disclaimer

ndm is an experiment, based on ops challenges we've been facing at npm. This is a dot release. I'll be moving things around a lot in this library, as we use it for our own deployments.

The `ndm` stanza is not officially supported by npm.

## LICENSE

ISC
