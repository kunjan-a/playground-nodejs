var StreamParser = require("./streamParser").StreamParser;
var eventsEmitter = require("events").EventEmitter;
var log = require ("./log").getLogger ("[XMLSocket]");
var util = require ("util");
var ltx = require("ltx");
var uuid = require("node-uuid");
var proxyUtil = require("./proxyUtils");

var SOCKET_NS = 'urn:tcp-proxy';

var XMLSocket = function() {
    util.inherits (XMLSocket, eventsEmitter);

    function XMLSocket(socket, shouldCheckConnection) {
        this.socketId = uuid(); // this is for debugging
        eventsEmitter.call(this);
        this.socket = socket;
        this.parser = new StreamParser ("UTF-8");
        this.connected = true;
        this.timer = null;
        this.shouldCheckConnection = shouldCheckConnection;

        this.attachListenerToSocket();
        this.attachListenerToParser();
    };

    XMLSocket.prototype.onStanzaReceived = function (stanza) {
        this.clearAndSchedulePing();
        if(stanza.is('ping',SOCKET_NS)){
            this.onPingReceived();
        }
    };

    XMLSocket.prototype.onPingReceived = function () {
        //log.info("on ping received" + this.socketId);
        this.sendPong();
    };

    XMLSocket.prototype.sendPong = function () {
        //log.info("sending pong packet" + this.socketId);
        var pong = new ltx.Element("pong", {xmlns: SOCKET_NS});
        this.writeElement(pong);
    };

    XMLSocket.prototype.sendPing = function () {
        log.debug ("sending ping packet "+ this.socketId);
        var ping = new ltx.Element("ping", {xmlns: SOCKET_NS});
        this.writeElement(ping.toString());
        var self = this;
        this.timer = setTimeout(function(){
            log.info("inside close connection due to pong not received");
            self.closeXMLSocket();
        }, 10000);
    };

    XMLSocket.prototype.clearAndSchedulePing = function () {
        if(this.timer) {
            clearTimeout(this.timer);
        }
        var self = this;
        if (this.shouldCheckConnection === true) {
            this.timer = setTimeout(function() {
                self.sendPing();
            }, 10000);
        }
    };

    XMLSocket.prototype.removeAllListener = function (){
        log.info("Inside remove listener from XMLSocket " + this.socketId);
        this.removeAllListeners("streamReconnect");
        this.removeAllListeners("streamCreated");
        this.removeAllListeners("stanza");
        //this.removeAllListeners("streamRestart");
        //this.removeAllListeners("streamEnd");
        //this.removeAllListeners("end");
        //this.removeAllListeners("error");
        this.removeAllListeners("close");
        return true;
    };

    XMLSocket.prototype.removeListenersFromParser = function(parser) {
        log.info("Inside remove listener from parser" + this.socketId);
        this.parser.removeAllListeners("stanza");
        this.parser.removeAllListeners("streamStart");
        this.parser.removeAllListeners("streamRestart");
        this.parser.removeAllListeners("streamEnd");
        return true;
    };

    XMLSocket.prototype.removeListenersFromSocket = function(socket) {
        log.info ("Inside remove listener from socket id " + this.socketId);
        this.socket.removeAllListeners("data");
        this.socket.removeAllListeners("end");
        this.socket.removeAllListeners("error");
        this.socket.removeAllListeners("close");
        return true;
    };

    XMLSocket.prototype.killXMLSocket = function () {
        if (this.connected) {
            log.debug ("Inside kill socket silently for socket id %s ",this.socketId);
            this.connected = false;
            this.removeListenersFromSocket (this.socket);
            this.removeListenersFromParser (this.parser);
            this.removeAllListener();
            this.socket.end();
            this.socket.destroy();
            if(this.timer){
                clearTimeout(this.timer);
            }
        }
    };

    XMLSocket.prototype.closeXMLSocket = function () {
        if (this.connected) {
            log.debug ("Inside close socket for socket id %s ",this.socketId);
            this.emit("close");
            this.killXMLSocket();
        }
    };

    XMLSocket.prototype.attachListenerToParser = function () {
        var self = this;
        this.parser.on('streamStart', function (name, attrs){
            log.info("##### on Stream Start #####");
            if (attrs.rsid) {
                self.emit('streamReconnect', name, attrs);
            } else {
                self.emit('streamCreated', name, attrs);
            }
            self.clearAndSchedulePing();
        });

        this.parser.on('stanza', function (stanza){
            self.onStanzaReceived(stanza); // pong is assumed to be any stanza within 10 sec
            if(!stanza.is('ping',SOCKET_NS) && !stanza.is('pong',SOCKET_NS)){
                self.emit('stanza', stanza);
            }
        });

        this.parser.on('streamRestart', function (name, attrs){
            //self.emit('streamRestart', name, attrs);
        });

        this.parser.on('streamEnd', function (name, attrs){
            log.info("##### on Stream end #####");
            //self.stopParser();
        });

        this.parser.on('error', function (string){
            log.info("##### On Stream Error ##### : %s",string);
            self.closeXMLSocket();
        });
    };

    XMLSocket.prototype.stopParser = function() {
        if(this.parser) {
            this.parser.stop();
            delete this.parser;
        }
    };

    XMLSocket.prototype.attachListenerToSocket = function (){
        var self = this;

        this.socket.on("connect", function(){
            log.info("##### On Socket Connect #####");
            self.emit("connect");
        });

        this.socket.on("end", function() {
            log.info("##### On Socket End #####");
            //self.emit("end");
        });

        this.socket.on("error", function(err) {
            log.info("##### On Socket Error #####");
            self.closeXMLSocket();
            //self.emit("error", err);
        });

        this.socket.on("close", function(hadError) {
            log.info("##### On Socket Close #####");
            self.closeXMLSocket();
        });

        this.socket.on("data", function(chunk){
            self.parser.write(chunk.toString());
        });
    };

    XMLSocket.prototype.write = function (name, attrs) {
        if (this.connected) {
            var response = proxyUtil.makeXML(name, attrs).toString();
            log.info("Writing xml " + response);
            try {
                this.socket.write(response);
            } catch (err) {
                return false;
            }
            return true;
        }
        return false;
    };


    XMLSocket.prototype.isConnected = function () {
        return this.connected;
    };

    XMLSocket.prototype.writeElement = function (element) {
        return this.writeString (element.toString());
    };

    XMLSocket.prototype.writeString = function (data) {
        if(this.connected){
            log.info("Writing data %s ",data);
            try {
                this.socket.write(data);
            } catch (err) {
                return false;
            }

            return true;
        }
        return false;
    };

    XMLSocket.prototype.getIPAddress = function () {
        return this.socket.remoteAddress;
    };

    return XMLSocket;
}();

exports.XMLSocket = XMLSocket;
