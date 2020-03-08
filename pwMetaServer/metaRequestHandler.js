var http = require('http');
var url = require('url');

var PORT = 80;

function MetaServer(config) {
    this.port = config.port || PORT;
    this.server = http.createServer();
    return this;
}


MetaServer.prototype.startServer = function () {
    var self = this;
    this.server.listen(this.port,function(){
        console.log("Server listening on port %d", self.server.address().port);
    });
};

MetaServer.prototype.onRequest = function(request, response){
    console.log('New request from:' + request.connection.remoteAddress);

    var urlObject = url.parse(request.url,true);

    var validPaths = ['move','meta','delete','domain/signup','domain/activate','verify_phone_verification_code','issue_phone_verification_code','call_phone_verification_code','profile','verified_phone_status'];

    console.log('Received request for '+urlObject.pathname );
    var params = urlObject.query;

    console.log('with parameters:'+params);

    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    request.answered = false;
    process.stdin.once('data', function (text) {
        if(request.answered === false){
            var input = JSON.parse(new String(text));
            console.log('Sending status:'+input.status);
            console.log('HTTP Body:'+input.body);
            response.writeHead(input.status);
            response.end(input.body);
            request.answered = true;
        }
    });
};

MetaServer.prototype.onClientError = function(request, response){
    console.log('Received client error.');
    try{
        response.end();
    }catch(err){}
};

MetaServer.prototype.onError = function(err){
    console.log('Error in contactList Https Server:'+err+'. Restarting.');
    var self = this;
    setTimeout(function () {
        try{
            self.server.close();
        }catch(excep){}
        self.server = http.createServer();
        self.attachListenersToServer();
        self.startServer();
    }, 1000);

};

MetaServer.prototype.attachListenersToServer = function(){
    var self = this;
    self.server.on('error',function(){
        self.onError.apply(self,arguments);
    });
    self.server.on('request',function(){
        self.onRequest.apply(self,arguments);
    });
    self.server.on('clientError',function(){
        self.onClientError.apply(self,arguments);
    });
};

init = function (config) {
    var metaServer = new MetaServer(config);
    metaServer.attachListenersToServer();
    metaServer.startServer();
};
exports.init = init;

init({port:"80"});
