/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 19/8/13
 * Time: 11:47 AM
 * To change this template use File | Settings | File Templates.
 */
var http = require("http");
var LOOKUP_SERVICE_PORT = "9000";
var LOOKUP_SERVICE_PATH = "/lookup";
var LOOKUP_SERVICE_HOST = "";

var lookupServiceTypeDomainMap = {
    "pwfd": "tfd-messaging-handler",
    "fb": "fb-messaging-handler",
    "gt": "gtalk-messaging-handler",
    "tt": "tt-messaging-handler",
    "mc": "mc-messaging-handler"
};

var lookupServiceDomainCache = {};

var DOMAIN_CACHE_TIMEOUT = 60 * 1000;

var log = require("./log").getLogger("[LOOKUP-SERVICE]");

var cacheHostAndPort = function(domain, port, host) {
    var invalidateCache;
    lookupServiceDomainCache[domain] = {
        port: port,
        host: host
    };
    invalidateCache = function() {
        if (lookupServiceDomainCache[domain]) {
            return delete lookupServiceDomainCache[domain];
        }
    };
    return setTimeout(invalidateCache, DOMAIN_CACHE_TIMEOUT);
};

var handleLookupResponse = function(domain, cb) {
    return function(res) {
        var data;
        if (res.statusCode === 200) {
            data = "";
            res.on("data", function(chunk) {
                return data += chunk;
            });
            return res.on("end", function() {
                var hostAndPort, parsedBody;
                try {
                    parsedBody = JSON.parse(JSON.parse(data).info);
                    log.debug("fetched details: ");
                    log.debug( parsedBody);
                    if (parsedBody["tcp-addr"]) {
                        hostAndPort = parsedBody["tcp-addr"].split(":");
                        log.info(hostAndPort[1]+hostAndPort[0]);
                        cacheHostAndPort(domain, hostAndPort[1], hostAndPort[0]);
                        return cb(null, hostAndPort[1], hostAndPort[0]);
                    } else {
                        log.debug(data);
                        return cb(res);
                    }
                } catch (err) {
                    log.debug(err);
                    return cb(err);
                }
            });
        } else {
            return cb(res.statusCode);
        }
    };
};

var lookupDomain = function(jid, servicetype, cb) {
    log.info("Domain is %s and Servicetype is %s",jid,servicetype);
    var options, serviceType;
    if (lookupServiceTypeDomainMap[servicetype] === void 0) {
        log.warn("" + servicetype + " not supported -- service type not known.");
        cb("Host not supported");
        return;
    }
    if(jid.domain === "domainto") {
        servicetype = 'tt';
    }
    if(jid.domain === "meta.domainto")  {
        servicetype = 'mc';
    }
    serviceType = lookupServiceTypeDomainMap[servicetype];

    options = {
        host: LOOKUP_SERVICE_HOST,
        port: LOOKUP_SERVICE_PORT,
        path: LOOKUP_SERVICE_PATH + ("?service-type=" + serviceType + "&entity=" + jid)
    };

    //return cb(null,"5222","localhost");

    return http.get(options, handleLookupResponse(jid, cb)).on("error", function(err) {
        log.debug("" + (new Date()) + " " + err);
        return cb(err);
    });
};

exports.lookupDomain = lookupDomain;

var init = function (config) {
    if(config.lookupServer) {
        LOOKUP_SERVICE_HOST = config.lookupServer.host || LOOKUP_SERVICE_HOST;
        LOOKUP_SERVICE_PATH = config.lookupServer.path || LOOKUP_SERVICE_PATH;
        LOOKUP_SERVICE_PORT = config.lookupServer.port || LOOKUP_SERVICE_PORT;
    }

}

exports.init = init;
