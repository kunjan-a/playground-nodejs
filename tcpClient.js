/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 24/10/12
 * Time: 12:56 PM
 * To change this template use File | Settings | File Templates.
 */
var net = require('net');

var client = new net.Socket();
port = 5489;//5336;
host="bridge1.handler.domain.to";//"10.10.1.70";//"10.10.52.200";
client.connect(port,host);
client.on("connect", function () {
    console.log("##### On Socket Connect #####");
    var response = '<stream:stream x:current-version="1.0" from="2a69310dc0c0ff170132@domain.to" x:user-jid="2a69310dc0c0ff170132@domain.to" to="domain.to" xml:lang="en" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" >';//"<stream:stream from=\"2a69310dc0c0ff170132@domain.to\" x:user-jid=\"2a69310dc0c0ff170132@domain.to\" " +
//        "to=\"domain.to\" xml:lang=\"en\" xmlns=\"jabber:client\" xmlns:stream=\"http://etherx.jabber.org/streams\" " +
//        "x:current-version=\"1.0\">";//'<stream:stream from="2a69310dc0c0ff170132@domain.to" x:user-jid="2a69310dc0c0ff170132@domain.to" to="domain.to" xml:lang="en" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" x:current-version="1.0">';
    try {
        client.write(response,function(err){
            if(err){
                console.log("Error while sending the stanza %s.",response);
                console.log(err);
            }
            console.log("Sent : %s",response);
        });
    } catch (err) {
        console.log(err);
    }
});

client.on("end", function () {
    console.log("##### On Socket End #####");
});

client.on("error", function (err) {
    console.log("##### On Socket Error %s #####");
    console.log(err);
});

client.on("close", function (hadError) {
    console.log("##### On Socket Close #####");
    console.log(hadError);
});

client.on("data", function (chunk) {
    var socket = client;
    console.log("##### On Socket Data (%s bytes) #####",chunk.length);
    console.log("Bytes read:%s BufferSize:%s Bytes written:%s",socket.bytesRead,socket.bufferSize,socket.bytesWritten);
    var received = chunk.toString();
    console.log(received);
    //socket.write(received);
    console.log("Bytes read:%s BufferSize:%s Bytes written:%s",socket.bytesRead,socket.bufferSize,socket.bytesWritten);
});

