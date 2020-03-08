/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 4/3/13
 * Time: 2:45 PM
 * To change this template use File | Settings | File Templates.
 */
var fs = require("fs");
var util = require('util');
var xml2js = require('xml2js');
var BSONPure = require('bson').BSONPure.BSON;
var BSONBuffalo = require('buffalo');

var jsonString,bsonPureBuffer,bsonBuffaloBuffer;
var jsonObject,bsonPureObject,bsonBuffaloObject;

var TEST_SERIALIZE=0;
var TEST_PARSE=1;
var TEST_REDIS_STORE = 2;
var TEST_REDIS_LOAD = 3;
var TESTNAMES = [];
TESTNAMES[TEST_SERIALIZE] = "serialization";
TESTNAMES[TEST_PARSE] = "parsing";
TESTNAMES[TEST_REDIS_LOAD] = "loading from redis";
TESTNAMES[TEST_REDIS_STORE] = "storing into redis";

var _benchmarkJson = function(storePath,data,test)   {
    var startTime, stopTime;
    startTime = Date.now();
    switch (test){
        case TEST_SERIALIZE:    jsonString = JSON.stringify(data);
                                break;
        case TEST_PARSE:        jsonObject = JSON.parse(jsonString);
                                break;
    }
    var timeTaken = Date.now()-startTime;
    switch (test)   {
        case TEST_SERIALIZE:    fs.writeFile(storePath,jsonString);
            break;
    }
    return timeTaken;
};

var _benchmarkBsonPure = function(storePath,data,test)   {
    var startTime, stopTime;
    startTime = Date.now();
    switch (test){
        case TEST_SERIALIZE:    bsonPureBuffer = BSONPure.serialize(data,false,true,false);
            break;
        case TEST_PARSE:        bsonPureObject = BSONPure.deserialize(bsonPureBuffer);
            break;
    }
    var timeTaken = Date.now()-startTime;
    switch (test)   {
        case TEST_SERIALIZE:    fs.writeFile(storePath,bsonPureBuffer);
            break;
    }
    return timeTaken;
};

var _benchmarkBsonBuffalo = function(storePath,data,test)   {
    var startTime, stopTime;
    startTime = Date.now();
    switch (test){
        case TEST_SERIALIZE:    bsonBuffaloBuffer = BSONBuffalo.serialize(data);
            break;
        case TEST_PARSE:        bsonBuffaloObject = BSONBuffalo.parse(bsonBuffaloBuffer);
            break;
    }
    var timeTaken = Date.now()-startTime;
    switch (test)   {
        case TEST_SERIALIZE:    fs.writeFile(storePath,bsonBuffaloBuffer);
            break;
    }
    return timeTaken;
};

function runBenchmarks(parentPath, dataWithoutBeautification,verbose,timeArr,test) {
    var timeTaken;

    if(verbose) console.log('Benchmarking xml without beautification for bson buffalo');
    timeTaken = _benchmarkBsonBuffalo(parentPath + '/log/bsonBuffalo4xmlWithoutBeautification', dataWithoutBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.buffaloWithoutBeautification = timeTaken;

    if(verbose) console.log('Benchmarking xml without beautification for bson Pure');
    timeTaken = _benchmarkBsonPure(parentPath + '/log/bsonPure4xmlWithoutBeautification', dataWithoutBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.pureWithoutBeautification = timeTaken;

    if(verbose) console.log('Benchmarking xml without beautification for json');
    timeTaken = _benchmarkJson(parentPath + '/log/json4xmlWithoutBeautification', dataWithoutBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.jsonWithoutBeautification = timeTaken;

}

function median(values) {

    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

var _process = function(parentPath,dataWithoutBeautification)  {
    var tests = [TEST_SERIALIZE,TEST_PARSE];
    tests.forEach(function(test){
        console.log("Running first run for %s without timing.",TESTNAMES[test]);
        var timeValues = {};
        runBenchmarks(parentPath, dataWithoutBeautification,false,timeValues,test);

        var jsonWithoutBeautification = [];
        var buffaloWithoutBeautification = [];
        var pureWithoutBeautification = [];

        var iter =4;
        console.log("Running %s runs for %s with timing.",iter,TESTNAMES[test]);
        for(;iter>0;iter--){
            runBenchmarks(parentPath, dataWithoutBeautification,false,timeValues,test);
            jsonWithoutBeautification.push(timeValues.jsonWithoutBeautification);
            buffaloWithoutBeautification.push(timeValues.buffaloWithoutBeautification);
            pureWithoutBeautification.push(timeValues.pureWithoutBeautification);
        }

        console.log("Median time values in millisec:");
        console.log("xml without Beautification: json-%s, buffalo-%s, pure-%s",median(jsonWithoutBeautification),median(buffaloWithoutBeautification),median(pureWithoutBeautification));

    });

};


function _loadData(parentPath,callback) {
    var xmlWithoutBeautification;
    var dataWithoutBeautification;

    fs.readFile(parentPath+'/testXmlWithoutBeautification.xml', function (err, data) {
        if (err) {
            console.log('Error while reading xml without beautification: %s',err);
            throw err;
        }
        console.log('xml without beautification read');//data);
        xmlWithoutBeautification = data;
        xml2js.parseString(xmlWithoutBeautification,function(err,result){
            if(err){
                console.log("Error while parsing xml without beautification:"+err);
                throw err;
            }
            dataWithoutBeautification = result;
            callback(dataWithoutBeautification);
        });

    });

}

function _initRedis(){

}

function _benchmark(parentPath){
    _loadData(parentPath,function(dataWithoutBeautification){
        _process(parentPath,dataWithoutBeautification);
    });
}

function init(){
    _initRedis();
    var parentPath = __dirname+'/';//'/media/sf_ONLY_ME/Training/javascript_the_good_parts/tries/JsonVsBson/';
    _benchmark(parentPath);
}

init();
