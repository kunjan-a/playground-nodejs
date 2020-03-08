var _ = require("underscore");
var requestCB = require("request");
var events = require("eventemitter2");
var deferred = require("deferred");
var url = require("url");
var receivers = require("./receivers");

var log;
var httpService = module.exports = new events.EventEmitter2();

var lsEvent = require("./ls-event");

var HTTP_REQUEST_TIMEOUT = 5 * 1000;
var lsHosts, currentLSHostIndex;


var request = deferred.promisify(function (options, cb) {
    requestCB(options, cb);
});

var httpGet = function (pathname, query, responseConverter) {
    var tryCount = 0;
    var requestAndSwitchHostOnError = function () {
        var hostIndex = currentLSHostIndex;
        var uri = url.format({protocol: "http:", host: lsHosts[hostIndex], pathname: pathname, query: query});
        log.info("API: %s", uri);
        return request({ method: 'GET', uri: uri, timeout: HTTP_REQUEST_TIMEOUT})
        (null, function (err) {
            if (currentLSHostIndex == hostIndex) {
                currentLSHostIndex++;
                if (currentLSHostIndex >= lsHosts.length) {
                    currentLSHostIndex = 0;
                }
            }

            tryCount++;
            if (tryCount >= 3) {
                log.info("API: throwing error for %s, max trycount=%s reached", uri, tryCount, err);
                throw err;
            }
            log.info("API: switching lshost on error %s, trycount=%s", uri, tryCount, err);
            return requestAndSwitchHostOnError();
        });
    };

    return requestAndSwitchHostOnError()
        .match(ensureResponseIsOk)
        (responseConverter);
};

var ensureResponseIsOk = function (response, body) {
    var statusCode = response.statusCode;
    var path = response.request.uri.pathname;
    if (statusCode == 200) {
        var trimmedBody = body.substring(0, 100);
        log.debug("API: result " + path + " " + trimmedBody);
        return body;
    } else {
        log.error("API ERROR: Non 200 status code received: %s. path: %s , body: %s", statusCode, path, trimmedBody);
        var error = new Error("InvalidHttpResponse: StatusCode returned from Lookup Service is not 200");
        error.response = response;
        throw error;
    }
};

var delay = function (fn, timeout) {
    return function () {
        var d = deferred() , self = this , args = arguments;
        setTimeout(function () {
            d.resolve(fn.apply(self, args));
        }, timeout);
        return d.promise;
    };
};

var infiniteHttpGet = function (pathname, query, responseConverter) {
    var retryCount = 0;
    var keepTrying = function () {
        return httpGet(pathname, query, responseConverter)
        (null, function (e) {
            log.error("Indefinitely Retrying %s. retryCount = %s. ex=", pathname, ++retryCount, e);
            return delay(keepTrying, 5 * 1000)();
        });
    };
    return keepTrying();
};

var extractEventFromBody = function (body) {
    return lsEvent.newLSEvent(JSON.parse(body).event);
};

httpService.init = function (lsHostnames, log4js) {
    log = log4js.getLogger("lsc-http-service");
    lsHosts = _(lsHostnames).map(function (lsHostname) {
        return lsHostname + ":9000";
    });
    currentLSHostIndex = 0;
};

httpService.register = function (registerParams, forceReReg) {
    if (!registerParams || !registerParams.addr || !registerParams.serviceType) {
        throw new Error("/register: Required Params Missing [params.addr, params.serviceType]");
    }
    var endpt = "/register";
    var params = {
        addr: registerParams.addr,
        "service-type": registerParams.serviceType,
        "info": registerParams.info || "",
        "jid": registerParams.serviceJID || "",
        "force-reregistration": forceReReg,
        "receiverCB": registerParams.receiverCB
    };

    var result;
    if (forceReReg) {
        result = httpGet(endpt, params, extractEventFromBody);
    } else {
        result = infiniteHttpGet(endpt, params, extractEventFromBody);
    }
    return result(function (regEvent) {
        httpService.emit("http-register-success", regEvent);
        if (params.receiverCB) {
            receivers.listen(params);
        }
        return regEvent;
    });
};

httpService.unregister = function (addr) {
    if (!addr) {
        throw new Error("/unregister: Required Params Missing [addr]");
    }
    httpService.emit("pre-http-unregister", addr);
    return httpGet("/unregister", {"addr": addr}, extractEventFromBody)
    (function (unregEvent) {
        httpService.emit("http-unregister-success", unregEvent);
        return unregEvent;
    });
};

httpService.getEventsInRange = function (min, max) {
    var extractEventsFromResult = function (body) {
        var result = JSON.parse(body);
        return _(result.events).map(function (event) {
            return lsEvent.newLSEvent(event);
        });
    };
    return infiniteHttpGet("/events", {"min-version": min, "max-version": max}, extractEventsFromResult)
    (function (events) {
        httpService.emit("http-events-fetch-success", events);
        return events;
    });
};

httpService.fetchCurrentState = function () {
    var parseCurrentStateResult = function (body) {
        var result = JSON.parse(body);
        result.events = _(result.events).map(function (event) {
            return lsEvent.newLSEvent(event);
        });
        return result;
    };
    return infiniteHttpGet("/current-state", {}, parseCurrentStateResult)
    (function (currentState) {
        httpService.emit("http-current-state-fetch-success", currentState);
        return currentState;
    });
};