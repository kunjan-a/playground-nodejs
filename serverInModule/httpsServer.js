/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 24/5/13
 * Time: 2:18 PM
 * To change this template use File | Settings | File Templates.
 */
var https = require('https');
var fs = require('fs');
var url = require('url');
var util = require('util');

var options = {
    key: fs.readFileSync('./serverInModule/wildcardCertificate/domain.to.key'),
    cert: fs.readFileSync('./serverInModule/wildcardCertificate/domain.to.crt')
};


function sendOkResponse(response) {
    console.log("Responding with 200 OK");
    response.statusCode = 200;
    response.setHeader("x-deviceconnectionstatus", "CONNECTED");
    response.setHeader("x-subscriptionstatus", "ACTIVE");
    response.setHeader("x-notificationstatus", "RECEIVED");
    response.end('OK');
}

function sendAccessForbiddenResponse(response) {
    var body = 'Access Forbidden';
    response.writeHead(403, body, {
    'Content-Length': body.length,
    'Content-Type': 'text/plain' });
    response.end();
}

function start(port){

    function onRequest(request,response){
        var urlParser = require('./urlParser');
        var parsed_url = urlParser.parse(request.url);
        /*
         response.write('bye');
         response.end();
         */
    }

    var default_port = 8085;
    port = port!=NaN?port:default_port;

    var server = https.createServer(options, onRequest);


    server.on('request', function(request,response){
        var data = "";
        console.log('New request from:%s',request.connection.remoteAddress);
//        console.log(request);

        var urlObject = url.parse(request.url,true);

        var params = urlObject.query;

        console.log('Received a request with method:%s for path:%s with headers %s and params:',request.method,urlObject.pathname, util.inspect(request.headers));
        for(var key in params){
//            console.log('%s : %s',key,parms[key]);
        }
        request.on('data',function(recData){
            data += recData;
        });
        request.on('end',function(){
            console.log('Received a request with data:%s',data);
            /*
             response.statusCode = 302;
             response.setHeader("Location", "/page");
             response.end();
             */
            setTimeout(function(){
                sendOkResponse(response);
                //sendAccessForbiddenResponse(response);
            },2000);
        });

    });
    server.listen(port);
    console.log('listening on port:%s',port);


}
start(9943);

exports.startHttpServer = start;
