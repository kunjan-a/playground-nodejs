var Assert = require("assert");
var lsCache = require("../lib/ls-cache");
var lsEvent = require("../lib/ls-event");
var log4js = require("log4js");

lsCache.init(null, log4js);

describe("ls-cache", function () {

    afterEach(function () {
        lsCache.test.reset();
    });

    it("lookup should return null when nothing is cached", function () {
        var event = lsCache.lookup("myuser.g@domain.com", "tfd-messaging-handler");
        Assert.ok(!event);
    });

    it("cache sticky-service's lookup result", function () {
        var regEvent = lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:1, isSticky:true});

        lsCache.test.updateLookupCache("myuser.g@domain.com", regEvent);

        var event = lsCache.lookup("myuser.g@domain.com", "tfd-messaging-handler");
        Assert.equal(event, regEvent);
    });


    it("do not cache non-sticky-service's lookup result", function () {
        var regEvent = lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:1, isSticky:false});

        lsCache.test.updateLookupCache("myuser.g@domain.com", regEvent);

        var event = lsCache.lookup("myuser.g@domain.com", "tfd-messaging-handler");
        Assert.equal(event, null);
    });

    it("serviceLookup", function () {
        var regEvent = lsEvent.newLSEvent({eventType:"registered", addr:"foo",
            serviceType:"tfd-messaging-handler", jid:"some_service@services.internal.domain.to", version:1});

        lsCache.test.updateRegCache(regEvent);

        var event = lsCache.serviceLookup("some_service@services.internal.domain.to");
        Assert.equal(event, regEvent);
    });

    it("serviceLookup should return undefined if corresponding service is unregistered", function () {
        var regEvent = lsEvent.newLSEvent({eventType:"unregistered", addr:"foo",
            serviceType:"tfd-messaging-handler", jid:"some_service@services.internal.domain.to", version:1});

        lsCache.test.updateRegCache(regEvent);

        var event = lsCache.serviceLookup("some_service@services.internal.domain.to");
        Assert.equal(event, undefined);
    });

    it("cached lookup value should be cleared when sticky service is re-registered", function () {
        var regEvent = lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:1, isSticky:true});
        lsCache.test.updateLookupCache("myuser.g@domain.com", regEvent);

        var regEvent2 = lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:2, isSticky:true});
        lsCache.test.updateRegCache(regEvent2);

        var event = lsCache.lookup("myuser.g@domain.com", "tfd-messaging-handler");
        Assert.equal(event, null);
    });

    it("should not cache stale lookup result for sticky service", function () {
        var regEvent2 = lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:2, isSticky:true});
        lsCache.test.updateRegCache(regEvent2);

        var regEvent = lsEvent.newLSEvent({eventType:"registered", addr:"foo", serviceType:"tfd-messaging-handler", version:1, isSticky:true});
        lsCache.test.updateLookupCache("myuser.g@domain.com", regEvent);

        var event = lsCache.lookup("myuser.g@domain.com", "tfd-messaging-handler");
        Assert.ok(!event);
    });
});
