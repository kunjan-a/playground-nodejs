var zmq = require("zmq");

var senders = module.exports;
var dealerCache = {};
var log;

senders.write = function(addr, payloadXML){
    var dealerSocket = dealerCache[addr];
    if(!dealerSocket ) {
        dealerSocket = zmq.createSocket("dealer");
        dealerSocket.connect(addr);
        dealerCache[addr] = dealerSocket;
    }
    log.debug('Sender: sending data to ',addr);
    dealerSocket.send(payloadXML);
};

senders.init = function(lsHostnames, log4js) {
    log = log4js.getLogger("sender");
    senders.shutdown = function() {
        log.info("Shutting Down ");
        for ( var addr in dealerCache ) {
            dealerCache[addr].close();
        }
    }
}
