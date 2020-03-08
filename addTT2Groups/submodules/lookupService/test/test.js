//var deferred = require("deferred");
//var lsClient = require("../lib");
//
//var log4js = require("log4js");
//log4js.clearAppenders();
//log4js.addAppender(log4js.consoleAppender());
//log4js.setGlobalLogLevel("DEBUG");
//
//lsClient.boot(["localhost"], log4js, "tcp://logstash1.tools.us-east-1b.aws.domain.to:2120", "myuser.g-test-node");
//
//lsClient.on("ls-hb-timed-out", function () {
//    console.error("ls-hb-timed-out: exiting");
//});
//
//lsClient.on("ready", function () {
//    deferred(1)
//    (function () {
//        return lsClient.unregister("tcp://xmpp-node-addr:5233");
//    })
//    (function () {
//        return lsClient.register({addr: "tcp://xmpp1:5233", serviceType:"tfd-messaging-handler"})
//    })
//    (function (result) {
//        console.log("register result=%s", result);
//    })
//    (function () {
//        console.log("Registering-------------------------------------------");
//        var cb = {receivedXML: function(){console.log("XML")},
//            receivedJSON: function(){console.log("JSON")}};
//        return lsClient.register({addr:"tcp://*:8000", serviceType:"myuser.g-test-service",cb:cb});
//    })
//    (function (result) {
//        console.log("register result=%s", result);
//    })
//    (function () {
//        console.log("----Making socket-----------------------------------");
//        var zmq = require("zmq")
//        var dealer = zmq.createSocket("dealer");
//        dealer.connect("tcp://*:8000");
//        dealer.send("<pi>foo</pi>");
//        dealer.send("  data for testing with trims        foo-fighters");
//    })
//
//    (
//
//    )
//    (function (result) {
//        console.log("lookup result=%s", result);
//    }, function (err) {
//        console.log("lookup error=", err);
//    })
////    (function () {
////        console.log("having fun only");
////    })
////    (function () {
////        console.log("--------------------------------------------------------------------------");
////        return lsClient.registeredNodes("tfd-messaging-handler");
////    })
////    (function (result) {
////        console.log("lookup result=%s", result, result.length);
////    }, function (err) {
////        console.log("lookup error=", err);
////    })
////    (function () {
////        console.log("--------------------------------------------------------------------------");
////        return lsClient.route("myuser.g@domain.com", "tfd-messaging-handler", "<iq>foo-1</iq>") ;
////    })
////    (function (result) {
////        console.log("lookup result=%s", result);
////    }, function (err) {
////        console.log("lookup error=", err);
////    })
////    (function () {
////        console.log("--------------------------------------------------------------------------");
////        return lsClient.routeToService("ec2_staging2.tfd-messaging-handler@services.internal.domain.to", "<iq>foo-2</iq>") ;
////    })
////    (function (result) {
////        console.log("lookup result=%s", result);
////    }, function (err) {
////        console.log("lookup error=", err);
////    })
////    (function () {
////        return deferred(
////            lsClient.register({addr:"tcp://xmpp-node-addr:5233", serviceType:"tfd-messaging-handler"}),
////            lsClient.lookup("myuser.g@domain.com", "tfd-messaging-handler"),
////            lsClient.lookup("myuser.g@domain.com", "tfd-messaging-handler")
////        );
////    })
////    (function () {
////
////        setTimeout(function () {
////            lsClient.lookup("myuser.g@domain.com", "foo");
////        }, 10);
////
////        return lsClient.register({addr:"tcp://xmpp-node-addr:5233", serviceType:"foo"});
////    })
////    (function () {
////        return lsClient.lookup("myuser.g@domain.com", "foo");
////    })
////    (function (result) {
////        console.log("register2 result=%s", result);
////    })
//    (function () {
//        return lsClient.lookup("some-xmpp1-entity", "tfd-messaging-handler");
//    })
//    (function (result) {
//        console.log("result1=%s", result);
//    }, function(err){
//        console.log("err1=", err)
//    })
//    (function(){
//        setTimeout(function(){
//            return lsClient.lookup("some-xmpp1-entity", "tfd-messaging-handler");
//        }, 5000);
//    })
//    (function (result) {
//        console.log("result1=%s", result);
//    }, function(err){
//        console.log("err1=", err)
//    })
////    (function () {
////        return lsClient.lookup("myuser.g@domain1.com", "history-service");
////    })
////    (function (result) {
////        console.log("result2=%s", result);
////    }, function(err){
////        console.log("err2=", err)
////    })
////    (function () {
////        var clog = lsClient.newCLogger({test_default_field: "test_default_field_val1"});
////        clog.info("testing 4", {test_field:"test field val1"});
////        clog.warn("testing 4", {test_field:"test field val2"});
////
////        clog = lsClient.newCLogger({test_default_field: "test_default_field_val2"});
////        clog.info("testing 5", {test_field:"test field val3"});
////        clog.warn("testing 5", {test_field:"test field val4"});
////        console.error("logging-done");
////    })
////    (function(){
////
////        lsClient.clogSending("xml packet",
////            {entity:"myuser.g@domain.com",
////                serviceType:"tfd-messaging-handler",
////                addr:"tcp://10.10.1.30:5233"});
////
////        lsClient.clogReceived("xml packet",
////            {entity:"myuser.g@domain.com",
////                serviceType:"tfd-messaging-handler",
////                addr:"tcp://10.10.1.30:5233"});
////        console.log("Done logging.");
////    })
//        .end(function (err) {
//            if (err) {
//                if (err.response) {
//                    console.log("sc=", err.response);
//                    console.log("sc=", err.response.statusCode);
//                }
//                console.log(err);
//            }
//        });
//});

