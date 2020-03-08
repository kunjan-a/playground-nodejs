var deferred = require("deferred");
var zmq = require("zmq");

var log;
var cmdSender = module.exports;
var dealer;
var pendingRequests = {};
var REQUEST_TIMEOUT = 15 * 1000;
var MAX_TRY_COUNT = 3;

cmdSender.write = function (request) {
    var requestId = request.requestId;
    if (!requestId) {
        return deferred(new Error("RequestId missing for this command"));
    }
    if (!pendingRequests[requestId]) {
        pendingRequests[requestId] = {
            def: deferred(),
            tryCount: 0,
            timerId: null,
            req: request
        };
        sendRequest(pendingRequests[requestId]);
    }
    return pendingRequests[requestId].def.promise;
}

var sendRequest = function (pendingReq) {
    pendingReq.tryCount++;
    pendingReq.timerId = setTimeout(function () {
        onError(new Error("Request timed out"), pendingReq, null);
    }, REQUEST_TIMEOUT);
    dealer.send(JSON.stringify(pendingReq.req));
}

cmdSender.init = function (lsHosts, log4js) {
    log = log4js.getLogger("cmd-sender");
    dealer = zmq.createSocket("dealer");
    dealer.highWaterMark = 1;

    lsHosts.forEach(function (lsHost) {
        dealer.connect("tcp://" + lsHost + ":9004");
    });

    dealer.on('message', onMessageHandler);
    cmdSender.shutDown = function () {
        log.info("Shutting Down");
        dealer.close();
    }
}

var onMessageHandler = function (unParsedResponse) {
    var pendingReq = null;
    var response = null;
    try {
        response = JSON.parse(unParsedResponse);
        log.debug("Received: ", response);
        if (!response.request || !response.request.requestId) {
            throw new Error("RequestId not found in response");
        }
        pendingReq = pendingRequests[response.request.requestId];
        if (pendingReq) {
            if (response.statusCode == 200) {
                resolveDeferred(pendingReq, response.result.event);
            }
            else {
                var err = new Error("Invalid response received");
                onError(err, pendingReq, response);
            }
        }
    } catch (err) {
        onError(err, pendingReq, response);
    }
}

var resolveDeferred = function (pendingReq, response) {
    pendingReq.def.resolve(response);
    clearTimeout(pendingReq.timerId);
    delete pendingRequests[pendingReq.req.requestId];
}

var onError = function (err, pendingReq, response) {
    var logFnName = "debug";
    err.response = response;
    if (pendingReq) {
        if (pendingReq.tryCount >= MAX_TRY_COUNT || (err.response && err.response.statusCode == 404)) {
            resolveDeferred(pendingReq, err);
            logFnName = "error";
        }
        else {
            clearTimeout(pendingReq.timerId);
            sendRequest(pendingReq);
        }
    }
    log[logFnName]("Received: ", err, " while processing response: ", response, " for request:", pendingReq);
}