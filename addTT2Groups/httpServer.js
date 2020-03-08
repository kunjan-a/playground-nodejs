var log = require('./log').getLogger("[HTTP Server]");
var fs = require("fs");
var util = require('util');
var ltx = require("ltx");
var http = require('http');
var url = require('url');
var RequestHandler = require('./RequestHandler').RequestHandler;
var Event2ListenerMap = require("./Utils/EventService.js").Event2ListenerMap;

var PORT = 8999;

var UPLOAD_URL = '/add';

function HTTPServerForSSC(config) {
    this.port = config.port || PORT;
    this.server = http.createServer();
    return this;
}


HTTPServerForSSC.prototype.startServer = function () {
    var self = this;
    this.server.listen(this.port,function(){
        log.info("Server listening on port %d", self.server.address().port);
    });
};

HTTPServerForSSC.prototype.onRequest = function(request, response){
    log.info('New request from:' + request.connection.remoteAddress);

    var urlObject = url.parse(request.url,true);

    if(urlObject.pathname !== UPLOAD_URL){
        response.writeHead(200);
        response.end('Invalid path.');
        return;
    }

    if(request.method !== 'GET'){
        response.writeHead(400);
        response.end('Only \'GET\' requests are processed.');
        return;
    }


    var params = urlObject.query;
    if(params.username && params.password){
        try{
            this.requestHandler = new RequestHandler(params.username,params.password,request,function(err,msg){
                if(err){
                    response.writeHead(200);
                    response.end(err);
                }else{
                    response.writeHead(200);
                    if(!msg){
                        msg = 'OK';
                    }
                    response.end(msg);
                }
            });
        }catch(error){
            if(error.type === 'SENDABLE'){
                response.writeHead(200);
                response.end(error.toString());
            }else{
                throw error;
            }
            if(this.requestHandler){
                this.requestHandler.cleanup();
                delete this.requestHandler;
            }
        }
    }else{
        response.writeHead(200);
        response.end('Parameters must contain username and password.');
    }
};

HTTPServerForSSC.prototype.onClientError = function(request, response){
    log.debug('Received client error.');
    if(this.requestHandler){
        this.requestHandler.cleanup();
        delete this.requestHandler;
    }
    try{
        response.end();
    }catch(err){}
};

HTTPServerForSSC.prototype.cleanup = function(){
    if(this.serverListeners){
        this.serverListeners.removeAll();
        delete this.serverListeners;
    }
};

HTTPServerForSSC.prototype.onError = function(err){
    log.error('Error in contactList Https Server:'+err+'. Restarting.');
    var self = this;
    setTimeout(function () {
        self.cleanup();
        try{
            self.server.close();
        }catch(excep){}
        self.server = http.createServer();
        self.attachListenersToServer();
        self.startServer();
    }, 1000);

};

HTTPServerForSSC.prototype.attachListenersToServer = function(){
    var self = this;
    self.serverListeners = new Event2ListenerMap(self.server);
    self.serverListeners.add('error',function(){
        self.onError.apply(self,arguments);
    });
    self.serverListeners.add('request',function(){
        self.onRequest.apply(self,arguments);
    });
    self.serverListeners.add('clientError',function(){
        self.onClientError.apply(self,arguments);
    });
};

init = function (config) {
    var httpsServerForSSC = new HTTPServerForSSC(config);
    httpsServerForSSC.attachListenersToServer();
    httpsServerForSSC.startServer();
};
exports.init = init;

