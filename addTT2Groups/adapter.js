var lookupService = require ("./lookupServiceHTML.js");
var httpsServer = require("./httpServer1.js");
var os = require('os');
var log = require("./log").getLogger("[ADAPTER]");

init = function (config) {
/*
    lookupService.init(function(){
        log.info("lookup ready");
        httpsServer.init(config);
    }, config);
*/
    lookupService.init(config);
    httpsServer.init(config);
};

exports.init = init;


