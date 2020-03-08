var ServiceTypeMap = {
    "fb" : "Facebook",
    "gt" : "GoogleTalk",
    "pwfd" : "PingPong"
};

var JID = function(){
    var JID = function (username, domain, resource, service) {
        this.username = null;
        this.domain = null;
        this.resource = null;
        this.service = null;

        if (username && domain == null && resource == null && service == null) {
            this.parseJID(username);
        } else if (domain) {
            this.setUsername(username);
            this.setDomain(domain);
            this.setResource(resource);
            this.setService(service);
        } else {
            throw new Error('Argument error');
        }
    };

    /* Setters that do stringprep normalization. */
    JID.prototype.setUsername = function(username) {
        this.username = username;// && nodeprep(user);
    };

    /* http://xmpp.org/rfcs/rfc6122.html#addressing-domain. */
    JID.prototype.setDomain = function(domain) {
        this.domain = domain;// && nameprep(domain.split(".").map(toUnicode).join("."));
    };

    JID.prototype.setResource = function(resource) {
        this.resource = resource;// && resourceprep(resource);
    };

    JID.prototype.setService = function(service) {
        this.service = service;
    };

    JID.prototype.parseJID = function(fullJid) {
        if (fullJid.indexOf('@') >= 0) {
            this.setUsername(fullJid.substr(0, fullJid.indexOf('@')));
            fullJid = fullJid.substr(fullJid.indexOf('@') + 1);
        }
        if (fullJid.indexOf('/') >= 0) {
            this.setResource(fullJid.substr(fullJid.indexOf('/') + 1));
            fullJid = fullJid.substr(0, fullJid.indexOf('/'));
        }
        if(fullJid.indexOf('~') >= 0) {
            this.setService(fullJid.substr(fullJid.indexOf('~')+1));
            fullJid = fullJid.substr(0,fullJid.indexOf('~'));
        }
        if(fullJid.indexOf('@') >= 0) {
            var error = new Error('JID parse error. Error in domain string:'+fullJid);
            error.type = 'SENDABLE';
            throw error;
        }
        this.setDomain(fullJid);
    };

    JID.prototype.toString = function() {
        var s = this.domain;
        if (this.username) {
            s = this.username + '@' + s;
        }
        if (this.service) {
            s = s + '~' + this.service;
        }
        if (this.resource) {
            s = s + '/' + this.resource;
        }
        return s;
    };

    JID.prototype.getJidWithoutResource = function () {
        var s = this.bare().toString();
        if(this.service) {
            s = s + '~' + this.service;
        }
        return s;
    };
    /**
     * Convenience method to distinguish users
     **/
    JID.prototype.bare = function () {
        if (this.resource || this.service)
            return new JID(this.username, this.domain, null, null);
        else
            return this;
    };

    /**
     * Comparison function
     **/
    JID.prototype.equals = function (other) {
        return (this.username == other.username && this.domain == other.domain && this.resource == other.resource && this.service == other.service) ;
    };

    JID.prototype.getServiceTypeFromService = function () {
        return ServiceTypeMap[this.service];
    };

    return JID;
}();

exports.JID = JID;
