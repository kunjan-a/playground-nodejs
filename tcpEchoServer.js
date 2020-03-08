/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 24/10/12
 * Time: 12:56 PM
 * To change this template use File | Settings | File Templates.
 */
var net = require('net');

var server = net.createServer(function(socket){
    var self = this;
    socket.on('data',function(chunk){
        console.log("##### On Socket Data (%s bytes) #####",chunk.length);
        console.log("Bytes read:%s BufferSize:%s Bytes written:%s",socket.bytesRead,socket.bufferSize,socket.bytesWritten);
        var received = chunk.toString();
        console.log(received);
        socket.write(received);
        console.log("Bytes read:%s BufferSize:%s Bytes written:%s",socket.bytesRead,socket.bufferSize,socket.bytesWritten);

    });
    socket.on("error",function(err){
        console.log("Error event received on socket:%s",require('util').inspect(err));
    });
    socket.on('end',function(){
        console.log("Socket ended");
        try{
            socket.write("fafddfg",function(err){
                if(err){
                    console.log("Error in write's callback:%s",err);
                }
            })
        }catch(err){
            console.log("Error thrown in try-catch:%s",err);
        }
    });
});

server.listen('9999',function(){
    console.log('tussi data bhejo on 9999 ji. Pleej hai!!')
});
