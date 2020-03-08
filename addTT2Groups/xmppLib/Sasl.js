var crypto = require('crypto');
var querystring = require('querystring');
var util = require('util');

function selectMechanism(mechanisms) {
    if (mechanisms.indexOf("PLAIN-PW-TOKEN") >= 0)
        return new PlainPwToken();
    else
        return null;
}
exports.selectMechanism = selectMechanism;

// Mechanisms
function Mechanism() {

}

function PlainPwToken () {
}
util.inherits(PlainPwToken, Mechanism);

PlainPwToken.prototype.name = "PLAIN-PW-TOKEN";

PlainPwToken.prototype.auth = function() {
//    if (this.domain === 'facebook.com' || this.domain === 'chat.facebook.com'){
//        return ("\0" + this.password + "\0" + this.pwToken);
//    } else {
        return ("\0" + this.username + "\0" + this.password + "\0" + this.pwToken);
//    }

};
