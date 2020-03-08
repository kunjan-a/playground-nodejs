var events = require("eventemitter2");
var deferred = require("deferred");

var router = module.exports = new events.EventEmitter2();

var common = require("./common");
var taskQueue = require("./task-queue");
var lsCache = require("./ls-cache");
var senders = require("./senders");
var cmdService = require("./cmd-service");

var routerGTQ = taskQueue.newGroupTaskQueue();
var log;

router.init = function (lsHostnames, log4js) {
    log = log4js.getLogger("router");
};

function serviceLookup(receiverEntity) {
    var lsEvent = lsCache.serviceLookup(receiverEntity);
    if (lsEvent) {
        return deferred(lsEvent);
    }
    throw new Error("Service Lookup Failed");
}

router.route = function (receiverEntity, receiverServiceType, payloadXML) {
    receiverEntity = common.stripResourceIfAny(receiverEntity);
    log.debug("route request received. ", receiverEntity, receiverServiceType, payloadXML);

    return routerGTQ.submit(receiverEntity + ":" + receiverServiceType, function () {
        var promise = isServiceJID(receiverEntity) ?
            serviceLookup(receiverEntity) :
            cmdService.lookup(receiverEntity, receiverServiceType);
        return promise.then(function (lsEvent) {
            senders.write(lsEvent.addr, payloadXML);
        });
    })
    (null, function (err) {
        log.error("error occurred during routing.", receiverEntity, receiverServiceType, payloadXML, err);
    })
};

function isServiceJID(entity) {
    var endSubstring = "@services.internal.domain.to";
    return entity.substr(-1 * endSubstring.length) === endSubstring;
}
