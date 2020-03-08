var util = require("util");
var redis = require("redis");
var log = require("./log").getLogger("[REDIS]");

var SSC_INSTANCE_ID = null;


var RedisClient = function(){
    function RedisClient(dbPopulator, port, host, instanceId){
        this.dbPopulator = dbPopulator;
        this.host = host;
        this.port = port;
        this.sscInstanceId = instanceId;
        this.redisClient = null;
        this.redisReady = false;

        this._initRedis();
    }

    RedisClient.prototype._initRedis = function () {
        var self = this;
        this.redisClient = redis.createClient(this.port, this.host);
        this.redisClient.on("ready", function () {
            self.redisReady = true;
            self.dbPopulator.emit("redisReady", {});
        });
        this.redisClient.on("error", function (err) {
            self.redisReady = false;
            log.error(err);
            self.dbPopulator.emit("redisError", err);
        });
    };

    RedisClient.prototype.getAllData = function (onResponseReceived){
        var self = this;
        var multi = this.redisClient.multiline();
        multi.hgetall("devices_" + this.sscInstanceId);
        multi.hgetall("sessions");
        multi.exec(function(err,replies){
            if (!err) {
                onResponseReceived(replies);
            }else{
                log.error('Error on fetching data from %s:%s  - ',self.host,self.port,err.toString());
                onResponseReceived(err.toString());
            }
        });
    };

    RedisClient.prototype.getDevice2SessionId = function(onResponseReceived){
        this.redisClient.hgetall("devices_" + this.sscInstanceId, function (err, reply) {
            if (!err) {
                onResponseReceived(reply);
            }else{
                log.error('Error on fetching devices2SessionId map:%s',err.toString());
                onResponseReceived(err.toString());
            }
        });
    };

    RedisClient.prototype.getSessionDetails = function(onResponseReceived){
        this.redisClient.hgetall("sessions", function (err, reply) {
            if (!err) {
                onResponseReceived(reply);
            }else{
                log.error('Error on fetching session details:%s',err.toString());
                onResponseReceived(err.toString());
            }
        });
    };

    return RedisClient;
}();
exports.RedisClient = RedisClient;

