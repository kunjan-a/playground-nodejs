/**
 * Created by kunjanagarwal on 3/16/16.
 */
var http=require('http');
var fs=require('fs');
var url=require('url');

var formHtml='<html><body><form>Data:<br><input type="text" name="firstname"<br</form><p>Kunjan Sir ki class</p></body></html>';

var staticData;

function sendForm(response) {
    if (staticData) {
        response.write(staticData);
        response.end();
    } else {
        fs.readFile('./form.html', function (err, data) {
            if (err) {
                console.log(err);
                response.statusCode = '502';
                response.end('oops');
            } else {
                staticData = data;
                response.write(data);
                response.end();
            }
        });
    }
}
function printHeaders(request) {
    console.log("*************************");
    console.log(request.headers);
    console.log("*************************");
    console.log("*************************");
}
function addDataListener(request) {
    request.on('data', function (sentData) {
        console.log("*************************");
        console.log("*************************");
        console.log("Received data " + sentData);
        console.log("*************************");
        console.log("*************************");
        data = sentData;
        request.meraData=sentData;
    });
}

function printRawRequest(request) {
    console.log("*************************");
    console.log("*************************");
    console.log(request);
    console.log("*************************");
    console.log("*************************");
}


function handleSendName(request, response) {
    addDataListener(request);
    request.on('end', function () {
        if (request.meraData) {
            response.end("Welcome " + request.meraData);
        } else {
            response.statusCode = "400";
            response.end("Bad")
        }
    })
}

var server = http.createServer(function(request, response){
    printHeaders(request);
    var reqUrl=request.url;
    console.log("received url:"+request.url);
    if(reqUrl==='/sendname'){
        handleSendName(request, response);
    }else{
        sendForm(response);
    }
});

server.listen(8080);