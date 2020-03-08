var util = require('util');
var os = require('os');
var adapter = require ("./adapter.js");

var DEFAULT_CONF_PATH = __dirname + '/./config/production.conf.js';

var conf_path = require('tav').set().config || DEFAULT_CONF_PATH;
var config;

try {
    if (conf_path[0] !== '/') {
        conf_path = './' + conf_path;
    }
    config = require(conf_path).config;
} catch (ex) {
    throw new Error(ex.toString() + ': while trying to read config file = ' + conf_path);
}

if (!config) {
    console.error(new Date() + ' No config provided');
}

var log_error = function (str) {
    console.error(new Date() + " " + str);
};

process.on('uncaughtException', function(ex) {
    var report = 'Uncaught Exception: ' + ex.toString() + '\n\n'
        + 'Stack trace: ' + ex.stack;
    log_error(report);
});

adapter.init (config);
