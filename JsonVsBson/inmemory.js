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

var TEST_SERIALIZE=1;
var TEST_PARSE=2;
var TEST_REDIS_STORE = 3;
var TEST_REDIS_LOAD = 4;

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

function runBenchmarks(parentPath, dataWithBeautification, dataWithoutBeautification,verbose,timeArr,test) {
    var timeTaken;

    if(verbose) console.log('Benchmarking xml with beautification for bson buffalo');
    timeTaken = _benchmarkBsonBuffalo(parentPath + '/log/bsonBuffalo4xmlWithBeautification', dataWithBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.buffaloWithBeautification = timeTaken;
    if(verbose) console.log('Benchmarking xml without beautification for bson buffalo');
    timeTaken = _benchmarkBsonBuffalo(parentPath + '/log/bsonBuffalo4xmlWithoutBeautification', dataWithoutBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.buffaloWithoutBeautification = timeTaken;

    if(verbose) console.log('Benchmarking xml with beautification for bson Pure');
    timeTaken = _benchmarkBsonPure(parentPath + '/log/bsonPure4xmlWithBeautification', dataWithBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.pureWithBeautification = timeTaken;
    if(verbose) console.log('Benchmarking xml without beautification for bson Pure');
    timeTaken = _benchmarkBsonPure(parentPath + '/log/bsonPure4xmlWithoutBeautification', dataWithoutBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.pureWithoutBeautification = timeTaken;

    if(verbose) console.log('Benchmarking xml with beautification for json');
    timeTaken = _benchmarkJson(parentPath + '/log/json4xmlWithBeautification', dataWithBeautification,test);
    if(verbose) console.log("Time taken is:"+timeTaken+" millisec");
    timeArr.jsonWithBeautification = timeTaken;
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

var _process = function(parentPath,dataWithBeautification,dataWithoutBeautification)  {
    var tests = [TEST_SERIALIZE,TEST_PARSE]
    tests.forEach(function(test){
        console.log("Running first run without timing.")
        var timeValues = {};
        runBenchmarks(parentPath, dataWithBeautification, dataWithoutBeautification,false,timeValues,test);

        var jsonWithBeautification = [];
        var jsonWithoutBeautification = [];
        var buffaloWithBeautification = [];
        var buffaloWithoutBeautification = [];
        var pureWithBeautification = [];
        var pureWithoutBeautification = [];

        console.log("Running with timing.");
        var iter =4;
        for(;iter>0;iter--){
            runBenchmarks(parentPath, dataWithBeautification, dataWithoutBeautification,false,timeValues,test);
            jsonWithBeautification.push(timeValues.jsonWithBeautification);
            jsonWithoutBeautification.push(timeValues.jsonWithoutBeautification);
            buffaloWithBeautification.push(timeValues.buffaloWithBeautification);
            buffaloWithoutBeautification.push(timeValues.buffaloWithoutBeautification);
            pureWithBeautification.push(timeValues.pureWithBeautification);
            pureWithoutBeautification.push(timeValues.pureWithoutBeautification);
        }

        console.log("Final time values:");
        console.log("xml with Beautification: json-%s, buffalo-%s, pure-%s",median(jsonWithBeautification),median(buffaloWithBeautification),median(pureWithBeautification));
        console.log("xml without Beautification: json-%s, buffalo-%s, pure-%s",median(jsonWithoutBeautification),median(buffaloWithoutBeautification),median(pureWithoutBeautification));

    });

};


function _loadData(parentPath,callback) {
    var xmlWithoutBeautification;
    var xmlWithBeautification;
    var dataWithoutBeautification;
    var dataWithBeautification;
    var loadedBeautified = false;
    var loadedExact = false;

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
            loadedExact = true;
            if(loadedBeautified)
                callback(dataWithBeautification,dataWithoutBeautification);
        });

    });


    fs.readFile(parentPath+'/testXmlWithBeautification.xml', function (err, data) {
        if (err) {
            console.log('Error while reading xml with beautification: %s',err);
            throw err;
        }
        console.log('xml with beautification read');//data);
        xmlWithBeautification = data;
//        dataWithBeautification = ltx.parse(xmlWithBeautification);
        xml2js.parseString(xmlWithBeautification,function(err,result){
            if(err){
                console.log("Error while parsing xml with beautification:"+err);
                throw err;
            }
            dataWithBeautification = result;
            loadedBeautified = true;
            if(loadedExact)
                callback(dataWithBeautification,dataWithoutBeautification);
        });
    });
}

function _initRedis(){

}

function _benchmark(parentPath){
    _loadData(parentPath,function(dataWithBeautification,dataWithoutBeautification){
        _process(parentPath,dataWithBeautification,dataWithoutBeautification);
    });
}

function init(){
    _initRedis();
    var parentPath = '/media/sf_ONLY_ME/Training/javascript_the_good_parts/tries/JsonVsBson/';
    _benchmark(parentPath);
}

init();
