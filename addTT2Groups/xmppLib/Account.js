var net = require ("net");
var lookupService = require ("../lookupServiceHTML.js");
var XMLSocket = require("../XMLSocket").XMLSocket;
var log = require ("../log").getLogger ("[ACCOUNT]");
var ltx = require("ltx");
var Stanza = require("./Stanza");
var JID = require('./Jid').JID;
var sasl = require("./Sasl");
var Buffer = require('buffer').Buffer;
var uuid = require("node-uuid");
var eventsEmitter = require("events").EventEmitter;
var util = require('util');
var os = require('os');

var NS_CLIENT = 'jabber:client';
var NS_XMPP_SASL = 'urn:ietf:params:xml:ns:xmpp-sasl';
var NS_XMPP_BIND = 'urn:ietf:params:xml:ns:xmpp-bind';
var NS_XMPP_SESSION = 'urn:ietf:params:xml:ns:xmpp-session';
var NS_STREAM =  'http://etherx.jabber.org/streams';
var NS_XMPP_STREAMS = 'urn:ietf:params:xml:ns:xmpp-streams';


var STATE_PREAUTH = 0,
    STATE_AUTH = 1,
    STATE_AUTHED = 2,
    STATE_BIND = 3,
    STATE_SESSION = 4,
    STATE_ONLINE = 5,
    STATE_DISCONNECT = 6;

var STATE_ARRAY = ["PREAUTH","AUTH","AUTHED","BIND","SESSION","ONLINE","DISCONNECT"];

var IQID_SESSION = 'sess',
    IQID_BIND = 'bind';

var MAX_TIMEOUT_INTERVAL = 1024;
var MAX_RETRY_LIMIT_AFTER_AUTH = 5;
var MAX_RETRY_LIMIT_FOR_AUTH = 10;

var Account = function () {
    util.inherits(Account,eventsEmitter);

    function Account (session, username, resource, password, shouldLogin) {
        log.debug ("Account Id %s : Inside Constructor New Account", username);
        this.session = session;
        eventsEmitter.call(this);
        this.numberOfRetriesAfterAuth = 0;
        this.numberOfRetriesForAuth = 0;
        this.jid = new JID (username);
        if(this.jid.service === null){
            this.jid.service = "pwfd";
        }
        this.initializeByLoginPacket (resource, password);
        this.state = STATE_DISCONNECT;
        if(shouldLogin === true) {
            this.initializeAndConnect ();
        }
    }

    Account.prototype.initializeByLoginPacket = function (resource, password) {
        log.debug (" Account Id %s : Inside Initialize By Login Packet", this.jid.toString());
        this.jid.resource = resource || uuid ();
        this.password = password;
        this.nextInterval = 1;
        this.timer = null;
    };

    Account.prototype.initializeAndConnect = function () {
        log.debug (" Account Id %s : Inside Initialize And Connect", this.jid.toString());
        this.state = STATE_PREAUTH;
        this.xmlSocket = null;
        this.connectToXMPPServer();
    };

    Account.prototype.isDisconnected = function () {
        var returnValue = true;
        if (this.state !== STATE_DISCONNECT) {
            returnValue = false;
        }
        log.debug (" Account Id %s : Inside Is Disconnected : Value Returned %s",  this.jid.toString(), returnValue);
        return returnValue;
    };

    Account.prototype.isConnected = function () {
        var returnValue = true;
        if (this.isDisconnected() || !this.xmlSocket || !this.xmlSocket.isConnected()) {
            returnValue = false;
        }
        log.debug (" Account Id %s : Inside IsConnected : Value Returned %s",  this.jid.toString(), returnValue);
        return returnValue;
    };

    Account.prototype.onSocketConnect = function () {
        log.debug (" Account Id %s : Inside On Socket Connect", this.jid.toString());

        var attributes = {
            from: this.jid.bare().toString(),
            'x:user-jid': this.jid.bare().toString(),
            to: this.jid.domain,
            'xml:lang': "en",
            'xmlns': NS_CLIENT,
            'xmlns:stream': NS_STREAM,
            'x:current-version' : "1.0"
        };
        this.xmlSocket.write ("stream:stream", attributes);
    };

    Account.prototype.retryLoginAfterExponentialTimeout = function () {
        if(this.nextInterval === 1){
            this.numberOfRetriesAfterAuth++;
        }
        this.numberOfRetriesForAuth++;
        log.debug (" Account Id %s : Inside Schedule Login Retry ", this.jid.toString());
        var self = this;

        if(this.numberOfRetriesAfterAuth <= MAX_RETRY_LIMIT_AFTER_AUTH && this.numberOfRetriesForAuth <= MAX_RETRY_LIMIT_FOR_AUTH){
            if(!this.retryTimePeriodInMilliseconds){
                if((self.nextInterval*2) > MAX_TIMEOUT_INTERVAL) {
                    self.nextInterval = MAX_TIMEOUT_INTERVAL;
                } else {
                    self.nextInterval = self.nextInterval * 2;
                }
            }
            var nextInterval = self.nextInterval*1000;
            if(this.retryTimePeriodInMilliseconds){
                nextInterval = this.retryTimePeriodInMilliseconds;
                delete this.retryTimePeriodInMilliseconds;
            }
            if(self.timer) {
                clearTimeout(self.timer);
            }
            log.debug (" Account Id %s : Scheduling Login Retry after %s milliseconds", this.jid.toString(), nextInterval);

            this.timer = setTimeout (function (){
                log.debug (" Account Id %s : Inside Retrying login after %s milliseconds", self.jid.toString(), nextInterval);
                self.initializeAndConnect ();
            }, nextInterval);
        }else{
            clearTimeout(self.timer);
            self.changeStateToDisconnect();
            self.nextInterval = 1;
            var errMsg = 'Exceeded maximum attempts for authentication.';
            if(this.numberOfRetriesAfterAuth > MAX_RETRY_LIMIT_AFTER_AUTH){
                errMsg = 'Exceeded maximum attempts after authentication.';
            }
            log.debug (" Account Id %s : Not retrying login any more. %s", self.jid.toString(), errMsg);
            self.emit('authFailure',errMsg);
        }
    };

    Account.prototype.onSocketClose = function () {
        log.debug (" Account Id %s : Inside On Socket Closed : Current account state is %s ", this.jid.toString(), STATE_ARRAY[this.state]);
        if(this.stanzaListener){
            this.stanzaListener.socketClosed();
        }
        if (!this.isDisconnected()) {
            this.retryLoginAfterExponentialTimeout();
        }
    };

    Account.prototype.attachListenerToXmlSocket = function () {
        log.debug (" Account Id %s : Inside Attaching Listener To XML Socket", this.jid.toString());
        var self = this;
        if (this.xmlSocket === null)
            return;
        this.xmlSocket.on("connect", function () {
            self.onSocketConnect ();
        });
        this.xmlSocket.on("stanza", function (stanza) {
            self.onStanzaReceivedFromServer (stanza);
        });
        this.xmlSocket.on("close", function (hadError) {
            self.onSocketClose();
        });
    };

    Account.prototype.sendStanzaToServer = function (stanza){
        if (this.xmlSocket) {
            log.debug (" Account Id %s : Stanza Send to Server %s", this.jid.toString(), stanza.toString());
            delete(stanza.attrs.from);
            return this.xmlSocket.writeElement (stanza);
        }
        return false;
    };

    Account.prototype.restartStream = function () {
        log.debug (" Account Id %s : Inside Restart Stream", this.jid.toString());
        var attrs = {};
        attrs.xmlns = NS_CLIENT;
        attrs['xmlns:stream'] = NS_STREAM;
        attrs.version = '1.0';
        attrs.to = this.jid.domain;
        attrs.from = this.jid.bare();

        this.xmlSocket.write('stream:stream',attrs);
    };

    Account.prototype.onSuccessReceived = function (stanza) {
        log.debug (" Account Id %s : Inside On Auth Success", this.jid.toString());
        this.nextInterval = 1;
        this.numberOfRetriesForAuth = 0;
        this.timer = null;
        this.state = STATE_AUTHED;
        this.pwToken = stanza.getChild('pw-token').getText();
        this.restartStream();
    };

    Account.prototype.onFailureReceived = function (stanza) {
        log.debug (" Account Id %s : Inside On Auth Failure",  this.jid.toString());
        if(!stanza.getChild("temporary-auth-failure")) {
            this.changeStateToDisconnect();
            this.emit("authFailure");
        }else{
            var retryPeriod = stanza.getChild("temporary-auth-failure").attrs["retry-after"];
            if (retryPeriod) {
                this.retryTimePeriodInMilliseconds = parseInt(retryPeriod);
            }else{
                delete this.retryTimePeriodInMilliseconds;
            }
        }
        this.xmlSocket.closeXMLSocket();
        if(this.stanzaListener){
            this.stanzaListener.authFailure();
        }
    };

    Account.prototype.onBindSuccess = function (stanza) {
        log.debug (" Account Id %s : Inside On Bind Success",  this.jid.toString());
        this.jid.parseJID (stanza.getChild('bind').getChild('jid').getText());
        this.state = STATE_SESSION;
        var sessionElement = new Stanza.Iq ( { type: 'set',
            to: this.jid.domain,
            id: IQID_SESSION
        });
        sessionElement.c('session',
            { xmlns: NS_XMPP_SESSION
            });
        this.sendStanzaToServer(sessionElement);
    };

    Account.prototype.onSessionSuccess = function (stanza) {
        log.debug (" Account Id %s : Inside On Session Success",  this.jid.toString());
        this.state = STATE_ONLINE;
        //this.setInitialPresence ();
        this.emit("authSuccess",this.pwToken);
        if(this.stanzaListener){
            this.stanzaListener.sessSuccess(this.pwToken);
        }
    };

    Account.prototype.onStanzaReceivedFromServer = function (stanza) {
        log.debug (" Account Id %s : Stanza Received from Server",  this.jid.toString(), stanza.toString());
        if (this.state != STATE_ONLINE && stanza.is('features')) {
            this.useFeatures(stanza);
        } else if (this.state == STATE_AUTH) {
            if (stanza.is('success', NS_XMPP_SASL)) {
                this.onSuccessReceived (stanza);
            } else if (stanza.is('failure', NS_XMPP_SASL)) {
				this.onFailureReceived (stanza);
            }
        } else if (this.state == STATE_AUTHED || this.state == STATE_BIND || this.state == STATE_SESSION) {
            if (stanza.is('iq') && stanza.attrs['id'] == IQID_BIND && stanza.attrs['type'] == 'result') {
                this.onBindSuccess (stanza);
                return;
            } else if (stanza.is('iq') && stanza.attrs['id'] == IQID_SESSION && stanza.attrs['type'] == 'result') {
                this.onSessionSuccess (stanza);
                return;
            }
        }else if (this.state == STATE_ONLINE) {
            this.onXmppStanzaReceived(stanza);
        }
    };

    Account.prototype.addStanzaListener = function(listener){
        this.stanzaListener = listener;
    };

    Account.prototype.onXmppStanzaReceived = function (stanza) {
        log.debug("Account Id %s : Inside On XMPP Stanza Received", this.jid.toString());
        if (stanza.is('error')){
            var report = 'Account Id '+this.jid.toString()+' : Stream Error Received '+stanza.toString() ;
        }else{
            if(this.stanzaListener){
                this.stanzaListener.stanzaReceived(stanza);
            }
        }
    };

    Account.prototype.setInitialPresence = function () {
        log.debug (" Account Id %s : Inside Set Initial Presence",  this.jid.toString());
        var presence = new Stanza.Presence ({xmlns : NS_CLIENT});
        presence.c('show').t('chat');
        presence.c('device').t('phone');
        presence.c('device-name').t('windowPhone');
        presence.c('version').t('0.0.1');
        this.sendStanzaToServer(presence);
    };

    Account.prototype.supportFeature = function (featuresElement) {
        log.debug("Account Id %s : Inside on Support Features Received", this.jid.toString());
        var supportedFeatures = ["enable-vcard-roster-push-to-mrs"];
        supportedFeatures.push("enable-groups-auto-enter");

        var iq = new Stanza.Iq({type:'set'});
        var query = iq.c('query', {xmlns:'http://domain.to/extension#features'});
        for (var i = 0; i < supportedFeatures.length; i++) {
            if (featuresElement.getChild(supportedFeatures[i])) {
                query.c(supportedFeatures[i]);
            }
        }
        this.sendStanzaToServer(iq);
    };

    Account.prototype.useFeatures = function (streamFeatures) {
        log.debug (" Account Id %s : Inside on Stream Features Received", this.jid.toString());
        if (this.state == STATE_PREAUTH && streamFeatures.getChild('features', "http://domain.to/extension#features")) {
            this.supportFeature(streamFeatures.getChild('features', "http://domain.to/extension#features"));
        }
        if (this.state == STATE_PREAUTH && streamFeatures.getChild('mechanisms', NS_XMPP_SASL)) {
            this.state = STATE_AUTH;
            var mechanism = sasl.selectMechanism ( streamFeatures.
                                                   getChild('mechanisms', NS_XMPP_SASL).
                                                   getChildren('mechanism', NS_XMPP_SASL).
                                                   map(function(el) { return el.getText(); }));

            if (mechanism) {
                mechanism.username = this.jid.username;
                mechanism.password = this.password || "";
                mechanism.pwToken = "someRandomString";
                log.debug('username:%s, password:%s, pwToken:%s',mechanism.username,mechanism.password,mechanism.pwToken);
                var authMsg = new Buffer(mechanism.auth()).toString('base64');
                this.sendStanzaToServer(new ltx.Element('auth', { xmlns: NS_XMPP_SASL,
                                                          mechanism: mechanism.name
                                                        }).t(authMsg));
            } else {
                log.error (" NO SASL MECHANISM FOUND");
            }
        } else if (this.state == STATE_AUTHED){
            if (streamFeatures.getChild('bind', NS_XMPP_BIND)) {
                this.state = STATE_BIND;
                var bindElement = new Stanza.Iq({ type: 'set',
                                           id: IQID_BIND
                                         });
                bindElement.c('bind',
                    { xmlns: NS_XMPP_BIND
                    });
                if (this.jid.resource)
                    bindElement.getChild('bind').c('resource').t(this.jid.resource);
                this.sendStanzaToServer(bindElement);
            }
        }
    };

    Account.prototype.connectToXMPPServer = function () {
        log.debug ("Account Id %s : Inside Connect to XMPP Server", this.jid.toString());
        var self = this;
        lookupService.lookupDomain(this.jid.bare(), this.jid.service , function(err, port, host) {
            var errorDetail, errorStanza;
            if (err) {
                log.error ("Account Id %s : Lookup Unsuccessful %s", self.jid.toString(),err.toString());
                errorDetail = new ltx.Element("host-unknown", {
                    from: self.jid.bare(),
                     xmlns: NS_XMPP_STREAMS
                });
                self.changeStateToDisconnect();
                self.emit('authFailure',errorDetail.toString());
            } else {
                log.debug ("Account Id %s : Lookup Successful", self.jid.toString());
                if(self.state !== STATE_DISCONNECT){
                    self.login(port, host);
                }
            }
        });
    };

    Account.prototype.login = function (port, host) {
        log.debug (" Account Id %s : Inside login", this.jid.toString());
            this.xmlSocket = new XMLSocket(new net.Socket(), false);
            this.attachListenerToXmlSocket();
            this.xmlSocket.socket.connect(port,host);
    };

    Account.prototype.logout = function () {
        log.debug (" Account Id %s : Inside Logout",  this.jid.toString());
        if (this.timer) {
            clearTimeout (this.timer);
        }
        if(this.state != STATE_DISCONNECT) {
            this.changeStateToDisconnect();
            if(this.xmlSocket){
                var presenceUnavailable = new ltx.Element("presence",{
                    type : "unavailable"
                });
                this.xmlSocket.writeElement(presenceUnavailable);
                this.xmlSocket.closeXMLSocket();
            }
            this.removeAccount();
		}
    };

    Account.prototype.changeStateToDisconnect = function () {
        log.debug (" Account Id %s : Inside Change state to disconnect",  this.jid.toString());
        this.state = STATE_DISCONNECT;
    };

    Account.prototype.removeAccount = function () {
        log.debug (" Account Id %s : Inside Remove Account",  this.jid.toString());
        delete this.xmlSocket;
    };

    return Account;

}();

exports.Account = Account;

