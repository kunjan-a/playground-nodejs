/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 10/9/12
 * Time: 1:13 PM
 * To change this template use File | Settings | File Templates.
 */
var url = require('url');

function parse(request_url){
    return url.parse(request_url);
}

exports.parse = parse;
