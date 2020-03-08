var log;

var epListener = require("./ep-listener");
var httpService = require("./http-service");

var reRegisterAddrs = { };

var startWatchingForUnregister = function (newRegEvent) {
    var lastRegEvent = reRegisterAddrs[newRegEvent.addr];
    if (!lastRegEvent || newRegEvent.version > lastRegEvent.version) {
        log.debug("watching for unregister of addr: %s", newRegEvent.addr);
        reRegisterAddrs[newRegEvent.addr] = newRegEvent;
    }
};

var stopWatchingForUnregister = function (addr) {
    delete reRegisterAddrs[addr];
};

var reRegister = function (unregEvent) {
    var regEvent = reRegisterAddrs[unregEvent.addr];
    if (regEvent && regEvent.version < unregEvent.version) {
        log.error("Unregister event received for registered service, probably due to missing HB. Please investigate.");
        httpService.register({addr:regEvent.addr, serviceType:regEvent.serviceType,
                serviceJID:regEvent.serviceJID, info:regEvent.info},
            false)
            .end();
    }
};

module.exports.init = function (lsHosts, log4js) {
    log = log4js.getLogger("lsc-auto-reregister");
    httpService.on("http-register-success", startWatchingForUnregister);
    epListener.on("unregistered", reRegister);
    httpService.on("pre-http-unregister", stopWatchingForUnregister);
};


