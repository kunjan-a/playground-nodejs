var _ = require("underscore");
var Assert = require("assert");
var log;
var epListener = require("./ep-listener");
var httpService = require("./http-service");
var cmdService = require("./cmd-service");

var regCache = { };
var lookupCache = { };

var isEventNew = function (event) {
    var oldEvent = regCache[event.addr];
    return !oldEvent || event.version > oldEvent.version;
};

var isEventStale = function (event) {
    var oldEvent = regCache[event.addr];
    return oldEvent && event.version < oldEvent.version;
};

var updateRegCache = function (events) {
    if (!_.isArray(events)) {
        events = [events]
    }
    _(events).each(function (event) {
        Assert.ok(event.isRegisterUnregisterEvent());
        if (isEventNew(event)) {
            log.debug("update regCache: %s", event);
            regCache[event.addr] = event;
        }
    });

};

var lookupKey = function (entity, serviceType) {
    return entity + "," + serviceType;
};

var updateLookupCache = function (entity, lookupEvent) {
    Assert.ok(lookupEvent.isRegisterEvent());
    if (!lookupEvent.isSticky) return;
    updateRegCache(lookupEvent);

    if (!isEventStale(lookupEvent)) {
        var key = lookupKey(entity, lookupEvent.serviceType);
        log.debug("updating lookupcache with lookupevent: %s, entity:%s", lookupEvent, entity);
        lookupCache[key] = lookupEvent;
    }
};

function localLookupForNonStickyService(serviceType) {
    var events = _(regCache).filter(function (event) {
        return event.isRegisterEvent() && !event.isSticky && event.serviceType == serviceType;
    });
    if (events.length == 0) {
        return null;
    }
    var randomIndex = Math.floor(Math.random() * events.length);
    return events[randomIndex];
}

var lookup = function (entity, serviceType) {

    var result = localLookupForNonStickyService(serviceType);
    if (result) {
        return result;
    }

    var key = lookupKey(entity, serviceType);
    var lookupEvent = lookupCache[key];

    if (!lookupEvent) return null;

    var regEvent = regCache[lookupEvent.addr];
    Assert.ok(regEvent);

    if (regEvent.version > lookupEvent.version) {
        delete lookupCache[key];
        return null;
    }

    return lookupEvent;
};

var registeredNodes = function (serviceType) {
    return _(regCache).filter(function (event) {
        return event.isRegisterEvent() && event.serviceType == serviceType;
    });
};

var serviceLookup = function (serviceJID) {
    return _(regCache).find(function (entry) {
        return entry.serviceJID === serviceJID && entry.isRegisterEvent();
    });
};

epListener.on("registered", updateRegCache);
epListener.on("unregistered", updateRegCache);
httpService.on("http-register-success", updateRegCache);
httpService.on("http-unregister-success", updateRegCache);
httpService.on("http-events-fetch-success", updateRegCache);
httpService.on("http-current-state-fetch-success", function (currentState) {
    updateRegCache(currentState.events);
});

cmdService.on("zmq-lookup-success", updateLookupCache);

module.exports.init = function (lsHosts, log4js) {
    log = log4js.getLogger("lsc-ls-cache");
};

module.exports.lookup = lookup;
module.exports.registeredNodes = registeredNodes;
module.exports.serviceLookup = serviceLookup;
module.exports.test = {
    reset: function () {
        regCache = { };
        lookupCache = { };
    },
    updateRegCache: updateRegCache,
    updateLookupCache: updateLookupCache
};

