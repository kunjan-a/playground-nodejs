var sinon = require("sinon");
var hbSender = require("../lib/hb-sender");
var lsCache = require("../lib/ls-cache");
var zmq = require("zmq");
var httpService = require("../lib/http-service");
var lsEvent = require("../lib/ls-event");
var Assert = require("assert");
var log4js = require("log4js");

lsCache.init(null, log4js);


function newHBReader() {
    var hbReaderSocket = zmq.createSocket("pull");
    hbReaderSocket.bindSync("tcp://127.0.0.1:9002");
    return hbReaderSocket;
}

describe("hb-sender", function () {
    var hbReader;

    beforeEach(function () {
        hbReader = newHBReader();
    });

    afterEach(function () {
        hbReader.close();
    });

    it("should send hb for registered addrs", function (done) {
        var clock = sinon.useFakeTimers();
        hbSender.init(["localhost"], log4js);

        httpService.emit("http-register-success",
            lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler"}));

        hbReader.once("message", function (buff) {
            Assert.deepEqual(JSON.parse(buff.toString()), {addr:"foo"});
            hbSender.shutDown();
            done();
        });

        clock.tick(6 * 1000);
        clock.restore();
    });

    it("should not send hb for unregistered addrs", function (done) {
        var clock = sinon.useFakeTimers();
        hbSender.init(["localhost"], log4js);

        httpService.emit("http-register-success",
            lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:1}));

        httpService.emit("http-unregister-success",
            lsEvent.newLSEvent({eventType:"unregistered", addr:"foo", serviceType:"tfd-messaging-handler", version:2}));

        hbReader.once("message", function (buff) {
            throw new Error("should not send any hb.");
        });

        clock.tick(6 * 1000);
        clock.restore();

        setTimeout(function () {
            hbSender.shutDown();
            done();
        }, 100);
    });
});