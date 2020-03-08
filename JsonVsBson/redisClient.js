/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 4/3/13
 * Time: 5:10 PM
 * To change this template use File | Settings | File Templates.
 */
var redis = require("redis");

var _redisClient = null;
var redisReady = false;

var initRedis = function (adapter, port, host) {
    _redisClient = redis.createClient(port, host);
    _redisClient.on("ready", function () {
        redisReady = true;
        console.log("Connecting to redis on: %s:%s",host,port);
        adapter.emit("redisReady", {});
    });
    _redisClient.on("error", function (err) {
        redisReady = false;
        console.log("Error while connecting to redis: %s",err);
        throw err;
    });
};

exports.getRedisClient = function () {
    return _redisClient;
};

init = function (adapter, config) {
    var port;
    var host;
    if (config.redis) {
        port = config.redis.port || 6379;
        host = config.redis.host || "127.0.0.1";
    }
    if (!config.SSC_InstanceId)
        throw new Error("SSC instance Id not defined");
    initRedis(adapter, port, host);
};
exports.init = init;