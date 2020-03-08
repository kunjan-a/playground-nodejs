var _ = require("underscore");
var events = require("eventemitter2");
var log;
var zmq = require("zmq");
var TaskQueue = require("./task-queue").TaskQueue;

var epListener = module.exports = new events.EventEmitter2();

var lsEvent = require("./ls-event");
var httpService = require("./http-service");

var taskQueue = new TaskQueue();
var lastReceivedVersion;

var publishEvent = function (event) {
    log.debug("publishing: %s", event);
    lastReceivedVersion = lastReceivedVersion > event.version ? lastReceivedVersion : event.version;
    epListener.emit(event.eventType, event);
};

var publishEvents = function (events) {
    _(events).each(publishEvent);
};

var syncStateWithLS = function () {
    var retryCount = 0;
    var keepTrying = function () {
        return httpService.fetchCurrentState()
            (function (currentState) {
                if (lastReceivedVersion > currentState.lastPublishedEventVersion) {
                    log.error("Stale /current-state received. " +
                        "lastReceivedVersion=" + lastReceivedVersion +
                        ", currentState.lastReceivedVersion=" + currentState.lastReceivedVersion +
                        ". Retrying Infinitely, retryCount=" + (++retryCount));
                    return keepTrying();
                } else {
                    publishEvents(currentState.events);
                    log.info("current state synchronised with LS");
                }
            });
    };
    log.info("Fetching current state");
    return keepTrying();
};


var eventProcessor = function (event) {
    taskQueue.submit(function () {
        if (lastReceivedVersion == null) {//ie first event
            if (!event.isHeartBeatEvent()) {
                return;
            }
            log.info("First event received");
            lastReceivedVersion = event.version;
            return syncStateWithLS()
                (function () {
                    epListener.emit("state-synchronised");
                });
        } else {
            var diff = event.version - lastReceivedVersion;
            if (event.isRegisterUnregisterEvent() ? diff > 1 : diff > 0) {
                log.error("Missed events(%s) ,event.version: %s, lastReceivedVersion: %s", event.eventType, event.version, lastReceivedVersion);
                httpService.getEventsInRange(lastReceivedVersion, event.version)
                    (publishEvents)
                    .end();
            }
            publishEvent(event);
        }
    });
};

var createEPSocket = function (lsHosts, eventCB) {
    var messageToEvent = function (buffer) {
        var event;
        try {
            event = lsEvent.parseEvent(buffer.toString());
        } catch (ex) {
            log.error("Invalid LSEvent received from LS. Please investigate and then report.", ex);
            return;
        }
        eventCB(event);
    };

    var epListenerSocket = zmq.createSocket("sub");
    epListenerSocket.highWaterMark = 100;
    lsHosts.forEach(function(lsHost){
        epListenerSocket.connect("tcp://" + lsHost + ":9001");
    });
    epListenerSocket.subscribe("");
    epListenerSocket.on("message", messageToEvent);
    log.info("Waiting for First event");
    return {
        shutDown:function () {
            epListenerSocket.removeListener("message", messageToEvent);
            epListenerSocket.close();
        }
    };
};

epListener.init = function (lsHosts, log4js) {
    log = log4js.getLogger("lsc-ep-listener");
    var epSocket = createEPSocket(lsHosts, eventProcessor);
    epListener.shutDown = function () {
        log.info("Shutting Down");
        epSocket.shutDown();
    };
};

