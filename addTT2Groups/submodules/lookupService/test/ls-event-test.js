var lsEvent = require("../lib/ls-event");
var Assert = require("assert");
describe("ls-event", function () {

    var parseEvent = function (event) {
        return lsEvent.parseEvent(JSON.stringify(event));
    };

    it("parse hb event", function () {
        var event = parseEvent({eventType:"heartbeat"});
        Assert.strictEqual(event.eventType, "heartbeat");
        Assert.strictEqual(event.version, 0);
    });

    it("parse register event", function () {
        var event = parseEvent({eventType:"registered",
            addr:"some addr", serviceType:"some serviceType", version:10, jid:"some jid", info:"some info"});
        Assert.equal(event.eventType, "registered");
        Assert.strictEqual(event.version, 10);
        Assert.strictEqual(event.addr, "some addr");
        Assert.strictEqual(event.serviceType, "some serviceType");
        Assert.strictEqual(event.info, "some info");
        Assert.strictEqual(event.serviceJID, "some jid");
    });

    it("parse unregister event", function () {
        var event = parseEvent({eventType:"unregistered",
            addr:"some addr", serviceType:"some serviceType", version:10, jid:"some jid", info:"some info"});
        Assert.equal(event.eventType, "unregistered");
        Assert.strictEqual(event.version, 10);
        Assert.strictEqual(event.addr, "some addr");
        Assert.strictEqual(event.serviceType, "some serviceType");
        Assert.strictEqual(event.info, "some info");
        Assert.strictEqual(event.serviceJID, "some jid");
    });

    it("register event requires addr", function (done) {
        try {
            parseEvent({eventType:"registered", serviceType:"some serviceType",
                version:10, jid:"some jid", info:"some info"});
        } catch (e) {
            done();
        }
    });

    it("register event requires serviceType", function (done) {
        try {
            parseEvent({eventType:"registered", addr:"some addr",
                version:10, jid:"some jid", info:"some info"});
        } catch (e) {
            done();
        }
    });

    it("uregister event requires addr", function (done) {
        try {
            parseEvent({eventType:"unregistered", serviceType:"some serviceType",
                version:10, jid:"some jid", info:"some info"});
        } catch (e) {
            done();
        }
    });

    it("uregister event requires serviceType", function (done) {
        try {
            parseEvent({eventType:"unregistered", addr:"some addr",
                version:10, jid:"some jid", info:"some info"});
        } catch (e) {
            done();
        }
    });

    it("new event", function () {
        var event = lsEvent.newLSEvent({eventType:"unregistered", addr:"some addr", serviceType:"some serviceType",
            version:10, jid:"some jid", info:"some info"});

        Assert.equal(event.eventType, "unregistered");
        Assert.strictEqual(event.version, 10);
        Assert.strictEqual(event.addr, "some addr");
        Assert.strictEqual(event.serviceType, "some serviceType");
        Assert.strictEqual(event.info, "some info");
        Assert.strictEqual(event.serviceJID, "some jid");
    });
});