var deferred = require("deferred");
var events = require("eventemitter2");

var log;
var cmdService = module.exports = new events.EventEmitter2();

var lsCache = require("./ls-cache");
var lsEvent = require("./ls-event");
var cmdSender = require("./cmd-sender");
var common = require("./common");

cmdService.init = function (lsHosts, log4js) {
    log = log4js.getLogger("cmd-service");
}

cmdService.lookup = function (entity, serviceType) {
    return deferred(1)
    (function () {
        if (!entity || !serviceType) {
            return new Error("/lookup: Required Params Missing [entity, serviceType]");
        }
        entity = common.stripResourceIfAny(entity);
        var cachedResult = lsCache.lookup(entity, serviceType);
        if (cachedResult) {
            return cachedResult;
        }

        var command = "lookup";
        return cmdSender.write({
            command: command,
            params: {
                entity: entity,
                serviceType: serviceType
            },
            requestId: entity + ":" + serviceType + ":" + command
        })
        (function (event) {
            var lookupRegEvent = lsEvent.newLSEvent(event);
            cmdService.emit("zmq-lookup-success", entity, lookupRegEvent);
            return lookupRegEvent;
        });
    })
};