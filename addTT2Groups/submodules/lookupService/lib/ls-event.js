var _ = require("underscore");

var properties = ["eventType", "addr", "serviceType", "serviceJID", "version"];

function LSEvent(event) {

    this.version = parseInt(event.version) || 0;
    this.eventType = event.eventType || "";
    this.addr = event.addr || "";
    this.serviceType = event.serviceType || "";
    this.serviceJID = event.jid || "";
    this.info = event.info || "";
    this.isSticky = event.isSticky || false;

    if (!this.isRegisterEvent() && !this.isUnregisterEvent() && !this.isHeartBeatEvent()) {
        throw new Error("eventType should be one of [registered, unregistered, heartbeat]. it was:" + this.eventType);
    }
    if (this.isRegisterUnregisterEvent() && (this.addr === "" || this.serviceType === "")) {
        throw new Error("LSEvent Validation failed: register/unregister event should have [addr, serviceType]. "
            + JSON.stringify(event));
    }
}
LSEvent.prototype.isRegisterEvent = function () {
    return this.eventType === "registered";
};

LSEvent.prototype.isUnregisterEvent = function () {
    return this.eventType === "unregistered";
};

LSEvent.prototype.isHeartBeatEvent = function () {
    return this.eventType === "heartbeat";
};

LSEvent.prototype.isRegisterUnregisterEvent = function () {
    return this.isUnregisterEvent() || this.isRegisterEvent();
};

LSEvent.prototype.toString = function () {

    var _properties = properties;

    if (this.isHeartBeatEvent()) {
        _properties = ["eventType", "version"];
    }

    return _(_properties).reduce(function (memo, prop) {
        return memo + prop + "=" + this[prop] + " ";
    }, "", this);
};

module.exports.newLSEvent = function (event) {
    return new LSEvent(event);
};

module.exports.parseEvent = function (eventStr) {
    return new LSEvent(JSON.parse(eventStr));
};