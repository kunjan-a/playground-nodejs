var zmq = require("zmq");

var receivers = module.exports;
var routerCache = {};
var log;

receivers.listen = function(params) {
    var routerSocket = routerCache[params.addr];
    if(!routerSocket) {
        routerSocket = zmq.createSocket('router');
        routerSocket.bind(params.addr, function(err){
            if(err) {
                log.error("Error Binding socket:",err);
            }
        });
        routerSocket.on('message', function(identity,data) {
            data = data.toString().trim();
            if( data.charAt(0) == '<') {
                log.debug("Receiver: XML data, message=",data);
                params.receiverCB.receivedXML(data);
            }
            else {
                log.debug("Receiver: JSON data, message=",data);
                params.receiverCB.receivedJSON(data);
            }
        });
        routerCache[params.addr] = routerSocket;
    }
    else {
        log.error("Listen called again on this address:",params.addr);
    }

}

receivers.init = function(lsHostnames,log4js) {
    log = log4js.getLogger("receiver");
    receivers.shutdown = function () {
        log.info("Shutting Down");
        for ( var addr in routerCache ) {
            routerCache[addr].close();
        }
    }
}