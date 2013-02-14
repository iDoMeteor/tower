/**
 * The main entry point to any Tower application.
 * Tower is split between multiple packages. This package is the one
 * you install with `npm install tower`. All other packages will be
 * installed automatically through npm as dependencies to this package.
 *
 * This package is the package manager that sets the environment up, for
 * both client-side and server-side code, and initializes the next
 * package.
 *
 * Each package has it's own tests and they are completely (for the most
 * part) independent of each other. This allows flexibility and quite a
 * bit of modularity amoung packages.
 */
require('harmony-reflect');

var Tower, util;
global.Tower = Tower = {};

util = require('util');

Tower.Error = function(msg, code) {
    var self = this;
    //this.__proto__.message = 123;
    this.__defineSetter__("message", function(message) {
        self.__proto__.message = message;
    });

    this.__defineSetter__("code", function(c) {
        self.__proto__.code = c;
    });

    this.message = msg;
    this.code = code;
};

Tower.Error.prototype = new Error();
Tower.Error.prototype.constructor = Tower.Error;

var last_color = [];

// Create a small helper function:
global.log = function(str, color) {
    if(!color) color = '[36m';
    var s = "";
    if (color instanceof Array) {
        color.forEach(function(ascii){
            s += "\033" + ascii;
        });
    } else {
        s = "\033" + color;
    }
    if (last_color !== s) {
        util.print('\n');
        last_color = s;
    }
    util.print('       ::' + s + str + '\033[0m');
};

var commandMap = {
    server: 'tower',
    new: 'tower-generator',
    install: 'tower-install',
    help: 'tower-help'
};

var getCommand = function() {
        var cmd = Tower.command.get();
        if(commandMap[cmd]) {
            return commandMap[cmd];
        } else {
            //throw Error("Command doesn't exist!", 'INVALIDCOMMAND');
            throw new Tower.Error('Invalid Command!');
            //throw e;
        }
    };

/**
 * We need to include the main package classes which will expose a few
 * global variables.
 */
(function() {
    var App, self, _, path, incomingOptions;

    incomingOptions = JSON.parse(process.argv[2]);
    path = require('path');
    _ = require('underscore');
    /**
     * A string helper method to capitalize the first letter
     * in a word.
     * @return {String} Converted String.
     */
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
    /**
     * A helper method that escapes regex characters in a string.
     *
     * @param  {String} string Original String
     * @return {String}        Converted/Escaped String
     */
    _.regexpEscape = function(string) {
        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    String.prototype.replacePathSep = function() {
        return this.replace(new RegExp('\\|\/', path.sep));
    };

    /**
     * Create a global Tower object. We are only going to use
     * a traditional JavaScript object instead of an Ember Namespace.
     *
     * 1) We don't want to load Ember right away.
     *
     * @type {[type]}
     */
    _.extend(global.Tower, {
        path: incomingOptions.dirname,
        env: incomingOptions.env,
        port: incomingOptions.port,
        cwd: process.cwd(),
        isServer: true,
        isClient: false,
        command: {
            argv: incomingOptions.commandArgs,
            get: function() {
                return incomingOptions.command;
            }
        }
    });

    // Require all of the package system:
    this.Bundler = new(require('./tower-packages/bundler'))();
    this.Package = require('./tower-packages/package');
    this.Packages = new(require('./tower-packages/packages'))();
    this.Container = require('./tower-packages/container');

    Packages.run(function(count) {
        log(count + ' package(s) have been loaded.');
        // Load up the first package inside Tower. We'll load the server.js
        // file as it's initialization. Once we load this file, we
        // leave the rest of the system up to Tower, except the bundler.
        //
        // We only want to include the main tower package if were starting
        // a full Tower process (server, console, routes, etc...)
        Packages.include(getCommand(), 'server');
        Tower.ready('environment.development.started');
        /**
         * This callback will run when the development environment has successfully started.
         * This means that the server is running and the framework is done initializing.
         * We can then start the bundler's watch method to start watching the filesystem.
         * This is the ONLY file watcher in the framework, which makes things really effecient.
         *
         * This file watcher will NOT run in production mode. Nor will any of the "Hot Code Push".
         * As we want to maximize performance for taking requests, not development tools.
         *
         * @return {Null}
         */
        Tower.ready('environment.development.started', function() {
            /**
             * Start the file watcher. This is the ONLY file watcher in the system.
             * This ensures that we have a fast, effecient development cycle. This will run
             * the bundler's stuff, as well as all the "Hot Code Push" and other file watching
             * tasks.
             *
             * This will initialize an instance of Tower.watch.
             */
            Bundler.start();
        });

    });


})();

//module.exports = require('./tower/server');
//Tower.srcRoot = require('path').resolve(__dirname + '/../');