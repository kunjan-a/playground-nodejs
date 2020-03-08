/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 17/9/12
 * Time: 6:49 PM
 * To change this template use File | Settings | File Templates.
 */
var http = require('http');
var util = require('util');

var messages=[];
var msgIndex=0;
setInterval(function(){
  messages[msgIndex]='Message number:'+msgIndex;
},3000);

http.createServer(function(request,response){
    console.log('received this :'+request);
    console.log('inspection output for request:'+util.inspect(request));
    response.end('thanku');
    console.log('Json string of request:'+JSON.stringify(request));
}).listen('8765');