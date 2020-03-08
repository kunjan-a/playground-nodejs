/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 24/5/13
 * Time: 12:17 PM
 * To change this template use File | Settings | File Templates.
 */
var request = require("./requestWrapper.js").getRequestObject();

var makeRequest = function(){
    var options = {};
    options.method = "POST";
    options.uri = "http://172.16.42.25:9999/";
    options.postBody = new Buffer("test","UTF-8");
    options.headers = object.headers || {};
    options.headers["Content_Type"] = "text/xml";
    options.headers["Content-Length"] = options.postBody.length;
    request.request(options, this._executeOnSuccess.bind(this), this._executeOnFailure.bind(this));

};