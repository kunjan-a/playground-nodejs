var _ = require("underscore");
var zmq = require("zmq");
var log;

var httpService = require("./http-service");
var HB_SEND_INTERVAL = 5 * 1000;
var registeredAddrsForHB = { };


var sendHB = function (hbWriterSocket) {
    _(registeredAddrsForHB).each(function (regEvent, addr) {
        log.debug("Sending HB for addr: %s", addr);
        hbWriterSocket.send(JSON.stringify({"addr":addr}));
    });
};

var startSendingHB = function (newRegEvent) {
    var lastRegEvent = registeredAddrsForHB[newRegEvent.addr];
    if (!lastRegEvent || newRegEvent.version > lastRegEvent.version) {
        log.debug("addr: %s updated for HB", newRegEvent.addr);
        registeredAddrsForHB[newRegEvent.addr] = newRegEvent;
    }
};

var stopSendingHB = function (unRegEvent) {
    var lastRegEvent = registeredAddrsForHB[unRegEvent.addr];
    if (lastRegEvent && unRegEvent.version > lastRegEvent.version) {
        delete registeredAddrsForHB[unRegEvent.addr];
    }
};

var hbSender = module.exports = {};

hbSender.init = function (lsHosts, log4js) {
    log = log4js.getLogger("lsc-hb-sender");
    httpService.on("http-register-success", startSendingHB);
    httpService.on("http-unregister-success", stopSendingHB);

    var hbWriterSocket = zmq.createSocket("push");
    hbWriterSocket.highWaterMark = 100;
    lsHosts.forEach(function (lsHost) {
        hbWriterSocket.connect("tcp://" + lsHost + ":9002");
    });

    var cronTimer = setInterval(function () {
        sendHB(hbWriterSocket);
    }, HB_SEND_INTERVAL);

    hbSender.shutDown = function () {
        log.info("Shutting Down");
        hbWriterSocket.close();
        clearInterval(cronTimer);
    };
};