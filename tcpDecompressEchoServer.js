/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 24/10/12
 * Time: 12:56 PM
 * To change this template use File | Settings | File Templates.
 */
var net = require('net');
var zlib = require('zlib');

var server = net.createServer(function(socket){
    var self = this;
    var chunkId = 0;
    var compressedLen = 0;
    var uncompressedLen = 0;

    var gunzip = zlib.createGunzip();
    function printStats(){
        console.log('compressed:'+compressedLen);
        console.log('uncompressed:'+uncompressedLen);
    }

    gunzip.on('data',function(chunk){
        uncompressedLen+=chunk.length;
        console.log('*****************\n'+chunk.toString()+'\n*****************');
        printStats();
    });
    gunzip.on('error',function(err){
        console.log('*** ERROR ***\n'+err);
        printStats();
    });
    socket.on('data',function(chunk){
        printStats();
        compressedLen+=chunk.length;
        var id = 0 + chunkId;
        console.log('Received '+chunk.length+' bytes');
        console.log('Sending chunk:'+id+' for decompression.');
        gunzip.write(chunk, function(){
            console.log('Finished decompressing chunk:'+id);
        });
        chunkId++;
    });
    socket.on('end',function(){
       gunzip.end();
    });
});

server.listen('9999',function(){
    console.log('Waiting');
});