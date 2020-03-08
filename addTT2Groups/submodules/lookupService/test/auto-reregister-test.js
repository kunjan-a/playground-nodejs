var sinon = require("sinon");
var deferred = require("deferred");
var autoReregister = require("../lib/auto-reregister");
var httpService = require("../lib/http-service");
var epListener = require("../lib/ep-listener");
var lsEvent = require("../lib/ls-event");
var log4js = require("log4js");

var lsCache = require("../lib/ls-cache");
lsCache.init(null, log4js);

autoReregister.init(null, log4js);

describe("auto-reregister", function () {
    var httpServiceMock;
    beforeEach(function () {
        httpServiceMock = sinon.mock(httpService);
    });

    afterEach(function () {
        httpServiceMock.verify();
        httpServiceMock.restore();
    });

    it("should not re-register when unregister ep-event received for any addr not registered from current system", function () {
        httpServiceMock.expects("register").never();
        epListener.emit("unregistered",
            lsEvent.newLSEvent({eventType:"unregistered", addr:"foo", serviceType:"tfd-messaging-handler", version:2}));
    });

    it("should re-register when unregister ep-event received for registered addr", function () {
        var registerCallArgs = {addr:"foo", serviceType:"tfd-messaging-handler", info:"some info", serviceJID:"some jid"};
        httpServiceMock.expects("register").withArgs(registerCallArgs, false).returns(deferred().promise).once();

        httpService.emit("http-register-success",
            lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler",
                info:"some info", jid:"some jid", version:1}));
        epListener.emit("unregistered",
            lsEvent.newLSEvent({eventType:"unregistered", addr:"foo", serviceType:"tfd-messaging-handler", version:2}));
    });

    it("should not re-register when unregister ep-event received for an addr being unregistered", function () {
        httpServiceMock.expects("register").never();

        httpService.emit("http-register-success",
            lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:1}));
        httpService.emit("pre-http-unregister", "foo");
        epListener.emit("unregistered",
            lsEvent.newLSEvent({eventType:"unregistered", addr:"foo", serviceType:"tfd-messaging-handler", version:2}));
    });
});