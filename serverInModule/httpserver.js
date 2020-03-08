/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 10/9/12
 * Time: 12:43 PM
 * To change this template use File | Settings | File Templates.
 */
var http = require('http');
var url = require('url');
var util = require('util');

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
    server.on('request', function(request,response){
        var data = "";
        console.log('New request from:%s',request.connection.remoteAddress);
//        console.log(request);

        var urlObject = url.parse(request.url,true);

        var params = urlObject.query;

        console.log('Received a request with method:%s for path:%s with headers %s and params:',request.method,urlObject.pathname, util.inspect(request.headers));

        for(var key in params){
            console.log('%s : %s',key,params[key]);
        }
        request.on('data',function(recData){
            data += recData;
        });
        request.on('end',function(){
            console.log('Received a request with data:%s',data);


            setTimeout(function(){
                console.log("Responding with 200 OK");


                response.statusCode = 302;
                response.setHeader("Location", "/page");
                response.end();

                /*
                 response.statusCode = 307;
                 response.setHeader("Location", "http://172.16.42.31:9999/redirected");
                 response.end();
                 */

                /*
                 response.statusCode = 200;
                 response.setHeader("x-deviceconnectionstatus", "CONNECTED");
                 response.setHeader("x-subscriptionstatus","ACTIVE");
                 response.setHeader("x-notificationstatus","RECEIVED");
                 response.end('OK');
                 */
            },2);
        });

    });

    port = port!=NaN?port:default_port;

    var server = http.createServer(onRequest);
    server.listen(port);
    console.log('listening on port:%s',port);


}
start(9999);

exports.startHttpServer = start;