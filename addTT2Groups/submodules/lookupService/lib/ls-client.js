var knox = require("knox");
var deferred = require("deferred");
var events = require("eventemitter2");
var lsClient = module.exports = new events.EventEmitter2();

var hbSender = require("./hb-sender");
var epListener = require("./ep-listener");
var httpService = require("./http-service");
var cmdService = require("./cmd-service");
var cmdSender = require("./cmd-sender");
var router = require("./router");
var autoReregister = require("./auto-reregister");
var lshbChecker = require("./lshb-checker");
var lsCache = require("./ls-cache");
var clog = require("./clog");
var senders = require("./senders");
var receivers = require("./receivers");
var log;

var services = [clog, httpService, router, epListener, hbSender, autoReregister,
    lshbChecker, lsCache, senders, receivers, cmdService, cmdSender];

var ENVCONFIGS = {
    production: {
        "ls-hosts": [
            "lookup1.apps.us-east-1c.aws.domain.to",
            "lookup2.apps.us-east-1d.aws.domain.to",
            "lookup3.apps.us-east-1c.aws.domain.to",
            "lookup4.apps.us-east-1d.aws.domain.to"
        ]},
    ec2staging: {
        "ls-hosts": [
            "10.10.100.151",
            "10.10.100.152"
        ]},
    staging: {
        "ls-hosts": [
            "staging-xmpp1.chat.pws",
            "staging-xmpp2.chat.pws"
        ]}
};

lsClient.boot = function (lsHosts, log4js, centralLoggerSubAddr, nodeID, env) {
    deferred(1)
    (function () {
        log = log4js.getLogger("lsClient");
        if (lsHosts) {
            return lsHosts;
        }
        return getLsHosts(env)
    })
    (function (lsHosts) {
        log.info("Creating lsClient with hosts:[" + lsHosts + "]");
        services.forEach(function (service) {
            if (service.init) {
                service.init(lsHosts, log4js, centralLoggerSubAddr, nodeID);
            }
        });
        lshbChecker.on("ls-hb-timed-out", function () {
            lsClient.emit("lookup-service-heartbeat-failure");
        });
        lshbChecker.on("ls-hb-timed-out", function () {
            lsClient.emit("lookup-service-heartbeat-failure");
        });
        var handleEPRegUnregEvent = function (event) {
            lsClient.emit(event.name, event);
        };
        epListener.on("registered", handleEPRegUnregEvent);
        epListener.on("unregistered", handleEPRegUnregEvent);
        epListener.once("state-synchronised", function () {
            initFunctions();
            lsClient.emit("ready");
        });
    })
    (null, function (err) {
        log.error("error occurred during client boot process.", err);
    });
};

var getLsHosts = function (env) {
    return fetchEnvConfigFileFromS3()
    (function (unParsedEnvConfig) {
        return JSON.parse(unParsedEnvConfig)[env]["ls-hosts"];
    })
    (null, function (err) {
        log.error("Unable to obtain hostList from S3", err);
        return ENVCONFIGS[env]["ls-hosts"];
    });
};

var fetchEnvConfigFileFromS3 = function () {
    var def = deferred();
    var client = knox.createClient({
        key: 'KEY',
        secret: 'SECRET',
        bucket: 'lookup'
    });
    client.getFile('/env-config.json', function (err, res) {
        if (err) {
            def.resolve(err);
            return;
        }
        var data = "";
        var resolved = false;
        res.on('close', function (err) {
            if (resolved)
                return;
            resolved = true;
            def.resolve(err);
        });
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            if (resolved)
                return;
            resolved = true;
            def.resolve(data);
        });
    });
    return def.promise;
};

var initFunctions = function () {
    lsClient.shutDown = function () {
        services.forEach(function (service) {
            if (service.shutDown) {
                service.shutDown();
            }
        });
    };

    lsClient.register = function (registerParams) {
        return httpService.register(registerParams, true);
    };

    //this method is deprecated
    lsClient.unregister = function (addr) {
        return httpService.unregister(addr);
    };

    lsClient.lookup = function (entity, serviceType) {
        return cmdService.lookup(entity, serviceType);
    };

    lsClient.registeredNodes = function (serviceType) {
        return lsCache.registeredNodes(serviceType);
    };

    lsClient.clogSending = function (payload, otherFields) {
        clog.sending(payload, otherFields);
    };

    lsClient.clogReceived = function (payload, otherFields) {
        clog.received(payload, otherFields);
    };

    lsClient.newCLogger = function (defaultFields) {
        return new clog.CLogger(defaultFields);
    };

    lsClient.route = function (receiverEntity, receiverServiceType, payloadXML) {
        return router.route(receiverEntity, receiverServiceType, payloadXML);
    };

    lsClient.routeToService = function (serviceJID, payloadXML) {
        var lsEvent = lsCache.serviceLookup(serviceJID);
        if (!lsEvent) {
            throw new Error("No Registered Service for given serviceJID");
        }
        return router.route(serviceJID, lsEvent.serviceType, payloadXML);
    };

    lsClient.serviceLookup = function (serviceJID) {
        return lsCache.serviceLookup(serviceJID);
    };

    ['register', 'unregister', 'lookup'].forEach(function (funcName) {
        lsClient[funcName + 'cb'] = function () {
            var args = Array.prototype.slice.call(arguments);
            var lastArg = args.pop();
            lsClient[funcName].apply(this, args).end(lastArg);
        };
    });
};
