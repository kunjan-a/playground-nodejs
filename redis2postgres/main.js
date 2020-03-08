/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 26/11/12
 * Time: 5:01 PM
 * To change this template use File | Settings | File Templates.
 */
var dbPopulator = require('./dbPopulator.js');
var log = require("./log").getLogger("[MAIN]");

var DEFAULT_CONF_PATH = __dirname + '/config/production.conf.js';

config = require(DEFAULT_CONF_PATH).config;

if (!config) {
    log.error('No config provided');
    process.exit(1);
}else{
    log.debug('Following the config: %s',config);
}

dbPopulator.init(config);