var events = require("eventemitter2");
var log;

var lshbChecker = module.exports = new events.EventEmitter2();

var epListener = require("./ep-listener");
var LSHB_CHECK_INTERVAL = 5 * 1000;
var LSHB_FAILURE_THRESHOLD = 60 * 1000;
var lastLSHBReceivedAt = +new Date();

var startExpectingLSHB = function () {
    return setInterval(function () {
        var diff = (+new Date()) - lastLSHBReceivedAt;
        if (diff > LSHB_FAILURE_THRESHOLD) {
            log.warn("Didn't receive a LS HB for %s millis", diff);
            lshbChecker.emit("ls-hb-timed-out", lastLSHBReceivedAt);
        }
    }, LSHB_CHECK_INTERVAL);
};

var updateLastLSHB = function (event) {
    lastLSHBReceivedAt = +new Date();
};

lshbChecker.init = function (lsHosts, log4js) {
    log = log4js.getLogger("lsc-lshb-checker");
    epListener.on("heartbeat", updateLastLSHB);

    epListener.on("state-synchronised", function () {
        var receiveInterval = startExpectingLSHB();
        lshbChecker.shutDown = function () {
            clearInterval(receiveInterval);
        };
    });
};