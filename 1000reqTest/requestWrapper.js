/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 24/5/13
 * Time: 12:18 PM
 * To change this template use File | Settings | File Templates.
 */
var request = require("node-web-request");

var getRequestObject = function () {
    return request;
};
exports.getRequestObject = getRequestObject;

var init = function (config) {
    console.log("Inside requestWrapper Initialization ", config);
    request.setWebRequestDefaultOptions(config);
};
exports.init = init;
