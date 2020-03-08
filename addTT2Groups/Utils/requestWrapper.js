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

