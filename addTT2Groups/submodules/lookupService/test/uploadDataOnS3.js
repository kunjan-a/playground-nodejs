var knox = require("knox")
//creating client
var client = knox.createClient({
    key: '',
    secret: '',
    bucket: 'lookup'
});

//data to upload
var ENVCONFIGS = {
    production: {
        "ls-hosts": [
            "lookup1.apps.us-east-1c.aws",
            "lookup2.apps.us-east-1d.aws",
            "lookup3.apps.us-east-1c.aws",
            "lookup4.apps.us-east-1d.aws"
        ]},
    ec2staging: {
        "ls-hosts": [
            "10.10.100.151",
            "10.10.100.152"
        ]},
    staging: {
        "ls-hosts": [
            "staging-xmpp1.chat.pws",
            "staging-xmpp2.chat.pws"
        ]}
};

//uploading the data
var string = JSON.stringify(ENVCONFIGS);
var req = client.put('/env-config.json', {
    'Content-Length': string.length, 'Content-Type': 'application/json'
});
req.on('response', function (res) {
    if (200 == res.statusCode) {
        console.log('saved to %s', req.url);
    }
});
req.end(string);

//fetch data
//client.getFile('/hostList', function(err, res){
//    res.setEncoding("utf8");
//    var data="";
//    res.on('data', function(chunk){
//           data += chunk;
//        console.log("Chunk:"+chunk);
//      });
////    data = data.toString();
//    res.on('end', function(){
//     data = JSON.parse(data);
//    console.log("Data : "+ data.hosts);
//    })
//});
//client.getFile('/hostList',function(err, res){
//    res.setEncoding('utf8')
//        if(res) {
//            console.log((res.body));
//        }
//})
