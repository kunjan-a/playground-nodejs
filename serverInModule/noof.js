#!/usr/bin/env node

function getPort(port) {
    var default_port = 8085;
    return port != NaN ? port : default_port;
}

function getFilePath() {
    var args = process.argv;
    if (args.length !== 3) {
        console.log("Usage: \n  noof <fully-qualified file path>");
        process.exit();
    }
    return args[2];
}

function getExternalIfaces() {
    var os = require('os');
    var ifaces=os.networkInterfaces();
    var externalIfaces = [];
    for (var dev in ifaces) {
        var alias=0;
        ifaces[dev].forEach(function(details){
            if (details.family=='IPv4' && details.internal === false) {
                externalIfaces.push(details.address);
            }
        });
    }
    return externalIfaces;
}

function onRequest(filePath){
    var fileName = require('path').basename(filePath);
    var count = 0;
    return function (request,res){
        console.log('You just made %s happy.',request.connection.remoteAddress);
        count++;
        console.log("%s has been gifted %s time%s",fileName,count,count>1?'s':'');
        res.setHeader("X-Powered-By","Kunj Talk");
        res.setHeader("Content-Disposition","attachment; filename=\""+fileName+"\"");
        res.sendfile(filePath);
    }
}

function startServer(args) {
    var express = require('express');
    var app = express();
    app.get('/', onRequest(args.filePath));
    app.listen(args.port);
}

function checkValidFile(args) {
    var path = require('path');
    if (!path.existsSync(args.filePath)) {
        console.log("Ok, I give up. Cannot locate %s", args.filePath);
        process.exit(-1);
    }
    var fs = require('fs');
    if (!fs.lstatSync(args.filePath).isFile()) {
        console.log("Bummer! I only support sharing files as of now :(");
        process.exit(-1);
    }
}

function getArgs(port) {
    var args = {};
    args.filePath = getFilePath();
    args.port = getPort(port);
    checkValidFile(args);
    return args;
}

function showRuntimeMessage(args) {
    var ifaces = getExternalIfaces();
    var msg = "Share the joys around via - ";
    var numIfaces = ifaces.length;
    ifaces.forEach(function (iface) {
        msg += " http://" + iface + ":" + args.port;
        numIfaces--;
        if (numIfaces > 0) {
            msg += ',';
        }
    });
    console.log(msg);
}

function noof(port){
    var args = getArgs(port);
    startServer(args);
    showRuntimeMessage(args);
}

noof(9999);
