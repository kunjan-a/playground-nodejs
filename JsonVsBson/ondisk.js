                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                rkJson(parentPath + '/log/json4xmlWithoutBeautification', dataWithoutBeautification,test);
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

        console.log("Running with timing.")
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
