var zmq = require("zmq");
var _ = require("underscore");
var moment = require("moment");
var publisher, nodeID;
exports.init = function (lsHosts, log4js, centralLoggerSubAddr, _nodeID) {
    nodeID = _nodeID;
    if (centralLoggerSubAddr) {
        publisher = zmq.createSocket('publisher');
        publisher.highWaterMark = 100;
        publisher.connect(centralLoggerSubAddr);
    }
};

function addFieldsAndLog(payload, otherFields, msgPrefix) {
    var logObj = {
        "@message":msgPrefix + payload,
        "@timestamp":moment().format("YYYY-MM-DD\\THH:mm:ss\\.SSSZ"),
        "@source":"router-lib",
        "@fields":_.extend({"nodeID":nodeID}, otherFields)
    };
    publisher.send(JSON.stringify(logObj));
}

exports.sending = function (payload, otherFields) {
    if (!publisher) return;
    addFieldsAndLog(payload, otherFields, "Sending: ");
};

exports.received = function (payload, otherFields) {
    if (!publisher) return;
    addFieldsAndLog(payload, otherFields, "Received: ");
};

function CLogger(defaultFields){
    this.defaultFields = defaultFields;
}

CLogger.prototype.debug=function(msg, fields){
    this.log({'@message': msg}, _.extend({}, fields, {"log_level": "DEBUG"}));
};

CLogger.prototype.info=function(msg, fields){
    this.log({'@message': msg}, _.extend({}, fields, {"log_level": "INFO"}));
};

CLogger.prototype.warn=function(msg, fields){
    this.log({'@message': msg}, _.extend({}, fields, {"log_level": "WARN"}));
};

CLogger.prototype.error=function(msg, fields){
    this.log({'@message': msg}, _.extend({}, fields, {"log_level": "ERROR"}));
};

CLogger.prototype.log=function(metadata, fields){
    if (!publisher) return;
    var logObj = _.extend(metadata, {
        "@timestamp": moment().format("YYYY-MM-DD\\THH:mm:ss\\.SSSZ"),
        "@source": "router-lib",
        "@fields": _.extend({}, this.defaultFields, fields, {"nodeID": nodeID})
    });

    publisher.send(JSON.stringify(logObj));
};

exports.CLogger = CLogger;