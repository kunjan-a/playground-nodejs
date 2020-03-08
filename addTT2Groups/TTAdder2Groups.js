/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 19/8/13
 * Time: 8:53 AM
 * To change this template use File | Settings | File Templates.
 */
var eventsEmitter = require("events").EventEmitter;
var util = require('util');
var AsyncTask = require('./Utils/AsyncTask.js').AsyncTask;
var log = require ("./log").getLogger ("[TTAdder]");
var request = require("./Utils/requestWrapper.js").getRequestObject();
var Stanza = require("./xmppLib/Stanza");

var HOST = "http://meta.aws.domain.to";
var PATH = "/api/meta/v2.1/";
var VERIFICATION_CODE_PATH = "/api/meta/v2.2/";

var TTAdder2Groups = function(){
    util.inherits(TTAdder2Groups,eventsEmitter);
    function TTAdder2Groups(channel, pwToken){
        eventsEmitter.call(this);
        this.currAsyncTask = null;
        this.channel = channel;
        this.pwToken = pwToken;
        channel.addStanzaListener(this);
        this.getTTAccount();
        this.counter = 0;
    }

    TTAdder2Groups.prototype.getTTAccount = function(){
        var self = this;
        var asyncTask = new AsyncTask([this.pwToken], false,
            this.getMetaAccountDetailFromToken.bind(this),
            function (jsonMetaAccountDetails) {
                if(!jsonMetaAccountDetails.error){
                    self.fetchGroupList();
                }else{
                    if(self.timeout){
                        clearTimeout(self.timeout);
                    }
                    self.timeout = setTimeout(function(){
                        self.getTTAccount();
                    },1000);
                }
            });
        this.makeAsyncRequest(asyncTask);
    };

    TTAdder2Groups.prototype.fetchGroupList = function(){
        var req = new Stanza.Iq({ type:'get',
            to:"groups.domain.to",
            id:"disco"
        });
        req.c('query',
            { xmlns:"http://jabber.org/protocol/disco#items"
            });
        this.channel.sendStanzaToServer(req);
    };

    TTAdder2Groups.prototype.onGroupListReceived = function(queryStanza){
        var addReq = {};
        var requests = 0;
        var self = this;
        if(queryStanza){
            var groupItems = queryStanza.getChildren('item');
            if(groupItems){
                groupItems.map(function(el){
                    var name = el.attrs['name'];
                    if(name){
                        var groupJid = el.attrs['jid'];
                        var iq = self.addMember(groupJid);
                        addReq[iq]={name:name};
                        requests++;
                    }
                })
            }
        }
        if(requests === 0){
            this.emit('finished');
            this.end();
        }else{
            clearTimeout(this.timeout);
            this.addReqMap = addReq;
            this.timeout = setTimeout(function(){
                self.emit('finished');
                self.end();
            },Object.keys(addReq).length*60*1000);
        }
    };

    TTAdder2Groups.prototype.addMember = function(groupJid){
        var iq = 'iq_' + Date.now()+'_'+this.counter++;
        var req = new Stanza.Iq({ type:'set',
            to:groupJid,
            id:iq
        });

        var query = req.c('query',
            { xmlns:"http://jabber.org/protocol/muc#admin"
            });
        query.c('item',
            {affiliation:"member",
             jid:this.ttAccount,
             "x-invitor-jid":this.channel.jid.bare().toString(),
             "x-name":this.name,
             "x-photo-url":this.imageUrl
            });
        this.channel.sendStanzaToServer(req);
        return iq;
    };

    TTAdder2Groups.prototype.stanzaReceived = function(stanza){
        if(!this.ttAccount){
            return;
        }
        if(stanza.attrs['type'] === 'result'){
            if(stanza.attrs['id'] === 'disco'){
                this.onGroupListReceived(stanza.getChild('query',"http://jabber.org/protocol/disco#items"));
                return;
            }
        }
        if(stanza.attrs['id'] && this.addReqMap && this.addReqMap[stanza.attrs['id']]){
            this.emit('groupAdded',this.addReqMap[stanza.attrs['id']].name);
            delete this.addReqMap[stanza.attrs['id']];
            if(Object.keys(this.addReqMap).length === 0){
                this.emit('finished');
                this.end();
            }
        }
    };

    TTAdder2Groups.prototype.authFailure = function(){
        this.ttAccount = null;
        this.clearCurrAsyncTask();
        clearTimeout(this.timeout);
        delete this.timeout;
    };

    TTAdder2Groups.prototype.socketClosed = function(){
        this.ttAccount = this.pwToken = null;
        this.clearCurrAsyncTask();
        clearTimeout(this.timeout);
        delete this.timeout;
    };

    TTAdder2Groups.prototype.sessSuccess = function(stanza){
        this.getTTAccount();
    };

    TTAdder2Groups.prototype.end = function(){
        this.clearCurrAsyncTask();
        clearTimeout(this.timeout);
        delete this.timeout;
        delete this.addReqMap;
    };

    TTAdder2Groups.prototype.onMetaAccountDetailReceived = function (token, metaAccountDetails, OnSuccessHandler) {
        var jsonMetaAccountDetails = JSON.parse(metaAccountDetails);
        this.ttAccount = jsonMetaAccountDetails.guid+'@domain.to~tt';
        this.name = jsonMetaAccountDetails.name;
        if(!this.name){
            this.name = jsonMetaAccountDetails.first_name+jsonMetaAccountDetails.last_name;
        }
        this.imageUrl = "http://i.domain.to/"+jsonMetaAccountDetails.image_hash;
        if (OnSuccessHandler) {
            OnSuccessHandler(jsonMetaAccountDetails);
        }
    };

    TTAdder2Groups.prototype.getMetaAccountDetailFromToken = function (token, onSuccessHandler) {
        var path = PATH + "meta?token=" + token;
        var self = this;
        var options = {uri:HOST + path, method:"GET", postBody:""};
        request.request(options, function (body, statusCode, headers) {
            self.onMetaAccountDetailReceived(token, body, onSuccessHandler);
        }, function (err, body, statusCode, headers) {
            if (onSuccessHandler) {
                if (err) {
                    onSuccessHandler({"error":"Unable to fetch meta detail", httpErr:true});
                } else {
                    onSuccessHandler({"error":"Unable to fetch meta detail", httpErr:false});
                }
            }
        });
    };

    TTAdder2Groups.prototype.clearCurrAsyncTask = function () {
        log.debug("Account Id %s : Inside clearCurrAsyncTask ", this.channel.jid.toString());
        if (this.currAsyncTask) {
            this.currAsyncTask.clearCallback();
            this.currAsyncTask = null;
        }
    };

    TTAdder2Groups.prototype.makeAsyncRequest = function (asyncTask) {
        log.debug("Account Id %s : Inside makeAsyncRequest ", this.channel.jid.toString());
        this.clearCurrAsyncTask();
        this.currAsyncTask = asyncTask;
        this.currAsyncTask.startTask();
    };

    return TTAdder2Groups;
}();
exports.TTAdder2Groups = TTAdder2Groups;
