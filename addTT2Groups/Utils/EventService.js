/**
 * Created with JetBrains WebStorm.
 * User: kunjan
 * Date: 2/11/12
 * Time: 1:10 PM
 * To change this template use File | Settings | File Templates.
 */
var EventListenerMap = function (eventEmitter) {
    if(!eventEmitter || typeof(eventEmitter.on) !== 'function'){
        throw new Error('Argument error.');
    }
    this.eventEmitter = eventEmitter;
};

EventListenerMap.prototype.add = function(event,listener){
    if(!event || typeof(listener)!== 'function'){
        throw new Error('Argument error.');
    }
    this[event] = listener;
    this.eventEmitter.on(event,listener);

};

EventListenerMap.prototype.removeAll = function(){
    for(var event in this){
        if(this.hasOwnProperty(event) && typeof(this[event]) === 'function'){
            this.eventEmitter.removeListener(event,this[event]);
        }
    }
};

exports.Event2ListenerMap = EventListenerMap;