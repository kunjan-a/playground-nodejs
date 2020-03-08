/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 30/10/12
 * Time: 5:59 PM
 * To change this template use File | Settings | File Templates.
 */
var log = require('./log').getLogger("[Request Handler]");
var Account= require("./xmppLib/Account").Account;
var Event2ListenerMap = require("./Utils/EventService.js").Event2ListenerMap;
var TTAdder2Groups = require("./TTAdder2Groups.js").TTAdder2Groups;

function RequestHandler(username, password, request, callback) {
    var self = this;
    this.username = username;
    this.password = password;
    this.callback = callback;

    this.request = request;
    this.attachListenersToRequest();

    this.channel = this.getChannel();
    this.attachListenersToChannel();

    this.authenticated = false;

    this.channel.initializeAndConnect();

    return this;
}

RequestHandler.prototype.sendSuccessResponse = function (msg){
    var self = this;

    if(this.authenticated){
        this.callback(null,msg);
        this.cleanup();
    }
};

RequestHandler.prototype.sendFailureResponse = function (err){
    this.callback(err.toString());
    this.cleanup();
};

RequestHandler.prototype.attachListenersToRequest = function () {
    var self = this;
    self.requestListeners = new Event2ListenerMap(self.request);

    // connection was terminated before response.end() was called or able to flush
    self.requestListeners.add('close', function () {
        log.debug('Received close event from client.');
        self.cleanup();
    });
};

RequestHandler.prototype.removeListenersFromRequest = function () {
    if(this.requestListeners){
        this.requestListeners.removeAll();
        delete this.requestListeners;
    }
};

RequestHandler.prototype.attachListenersToChannel = function () {
    var self = this;
    self.channelListeners = new Event2ListenerMap(self.channel);
    self.channelListeners.add('authFailure', function () {
        self.onAuthFailure.apply(self, arguments);
    });
    self.channelListeners.add('authSuccess', function () {
        self.onAuthSuccess.apply(self, arguments);
    });
};

RequestHandler.prototype.removeListenersFromChannel = function () {
    if(this.channelListeners){
        this.channelListeners.removeAll();
        delete this.channelListeners;
    }
};

RequestHandler.prototype.attachListenersToTTAdder = function () {
    var self = this;
    self.ttAdderListeners = new Event2ListenerMap(self.ttAdder2Groups);
    self.ttAdderListeners.add('groupAdded', function () {
        self.onGroupAdded.apply(self, arguments);
    });
    self.ttAdderListeners.add('finished', function () {
        self.onFinished.apply(self, arguments);
    });
};

RequestHandler.prototype.removeListenersFromTTAdder = function () {
    if(this.ttAdderListeners){
        this.ttAdderListeners.removeAll();
        delete this.ttAdderListeners;
    }
};

RequestHandler.prototype.onGroupAdded = function(group){
    if(!this.groups){
        this.groups = [];
    }
    this.groups.push(group);
};

RequestHandler.prototype.onFinished = function(){
    this.removeListenersFromTTAdder();
    if(!this.groups){
        this.sendSuccessResponse("No groups found");
    }else{
        this.sendSuccessResponse(this.groups.toString());
    }
};

RequestHandler.prototype.onAuthFailure = function (err) {
    if(!err){
        err = 'Authentication failed.';
    }
    log.info('Received authFailure from channel:'+err+' for user:'+this.username);
    this.authenticated = false;
    this.sendFailureResponse(err);
};

RequestHandler.prototype.onAuthSuccess = function (pwToken) {
    log.info('Successfully authenticated on channel for user:'+this.username);
    this.authenticated = true;
    this.ttAdder2Groups = new TTAdder2Groups(this.channel,pwToken);
    this.attachListenersToTTAdder();
};

RequestHandler.prototype.getChannel = function () {
    return new Account(null, this.username, null, this.password, false);
};

RequestHandler.prototype.cleanup = function () {
    log.debug('Inside clean up of request handler for user:'+this.username);
    if(this.channel){
        this.removeListenersFromChannel();
        this.channel.logout();
        delete this.channel;
    }
    if(this.request){
        this.removeListenersFromRequest();
        delete this.request;
    }
    if(this.ttAdder2Groups){
        this.removeListenersFromTTAdder();
        this.ttAdder2Groups.end();
        delete this.ttAdder2Groups;
    }
    delete this.callback;
};

exports.RequestHandler = RequestHandler;
