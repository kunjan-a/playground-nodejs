var Assert = require("assert");
var deferred = require("deferred");
var log4js = require("log4js");
var httpService = require("../lib/http-service");
var lsCache = require("../lib/ls-cache");
var cmdSender = require("../lib/cmd-sender");
var cmdService = require("../lib/cmd-service");

var lookupList = ["localhost"];
lsCache.init(null, log4js);
httpService.init(lookupList, log4js);

function responseDeepEquals(actualRes, expectedRes, test) {
    console.log("Deep equals comparison fix: actual:", actualRes, "expected:", expectedRes);
    return test.deepEqual(actualRes, expectedRes);
}

describe("cmd-service", function () {
    beforeEach(function () {
        cmdSender.init(lookupList, log4js);
    });
    afterEach(function () {
        cmdSender.shutDown();
    });

    describe("cmd-service for tfd messaging handler", function () {
        it("should get 404 when no endpoint of tfd service type is registered", function (done) {
            cmdService.lookup("some-entity", "tfd-messaging-handler")
            (null, function (err) {
                responseDeepEquals(err.response,
                    {
                        statusCode: 404,
                        result: {errorMessage: "Not Found"},
                        request: {
                            command: "lookup",
                            params: {
                                entity: "some-entity",
                                serviceType: "tfd-messaging-handler"
                            },
                            requestId: "some-entity:tfd-messaging-handler:lookup"
                        }
                    },
                    Assert);
            })
                .end(done);
        });

        it("should get 200 when corresponding endpoint is registered", function (done) {
            httpService.register({addr: "tcp://xmpp1:5233", serviceType: "tfd-messaging-handler"})
            (function () {
                return cmdService.lookup("some-xmpp1-entity", "tfd-messaging-handler")
            })
            (function (result) {
                result.version = 1;
                responseDeepEquals(result,
                    {
                        version: 1,
                        eventType: 'registered',
                        addr: 'tcp://xmpp1:5233',
                        serviceType: 'tfd-messaging-handler',
                        serviceJID: '',
                        info: '{}',
                        isSticky: true
                    },
                    Assert);
            })
                .end(done);
        });
    });

    it("should get 404 when no endpoint of given service type is registered", function (done) {
        cmdService.lookup("some-entity", "some-service")
        (null, function (err) {
            responseDeepEquals(err.response,
                {
                    statusCode: 404,
                    result: {errorMessage: "Not Found"},
                    request: {
                        command: "lookup",
                        params: {
                            entity: "some-entity",
                            serviceType: "some-service"
                        }  ,
                        requestId: "some-entity:some-service:lookup"
                    }
                },
                Assert);
        })
            .end(done);
    });

    it("should get 200 when corresponding endpoint is registered", function (done) {
        httpService.register({addr: "some-addr", serviceType: "some-service"})
        (function () {
            return cmdService.lookup("some-entity", "some-service")
        })
        (function (result) {
            result.version = 1;
            responseDeepEquals(result,
                {
                    version: 1,
                    eventType: 'registered',
                    addr: 'some-addr',
                    serviceType: 'some-service',
                    serviceJID: '',
                    info: '{}',
                    isSticky: false
                },
                Assert);
        })
            .end(done);
    });
});