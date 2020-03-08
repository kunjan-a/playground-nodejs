__hasProp = Object.prototype.hasOwnProperty,
__extends = function(child, parent) { 
		for (var key in parent) { 
			if (__hasProp.call(parent, key)) child[key] = parent[key];
		} 
		function ctor() { 
			this.constructor = child; 
		} 
		ctor.prototype = parent.prototype; 
		child.prototype = new ctor; 
		child.__super__ = parent.prototype; 
		return child; 
};

var util = require('util');
var ltx = require('ltx');
var expat = require('node-expat');
var EventEmitter = require('events').EventEmitter;
var log = require ("./log").getLogger ("[PARSER]");

var StreamParser = (function(_super) {

  __extends(StreamParser, _super);

  function StreamParser(charset) {
    var self;
    this.charset = charset;
    self = this;
    this.parser = new expat.Parser(this.charset);
    self.streamStarted = false;
    this.parser.addListener('startElement', function(name, attrs) {
      var child;
      if (self.streamStarted) {
        if (name === 'stream:stream') {
          return self.emit('streamRestart', name, attrs);
        } else {
          child = new ltx.Element(name, attrs);
          if (!self.element) {
            return self.element = child;
          } else {
            return self.element = self.element.cnode(child);
          }
        }
      } else {
        if (name === 'stream:stream') {
          self.streamStarted = true;
          return self.emit('streamStart', name, attrs);
        } else {
          return self.emit('error', 'received stanza without a stream start');
        }
      }
    });
    this.parser.addListener('endElement', function(name, attrs) {
      if (self.streamStarted) {
        if (name === 'stream:stream') {
          self.end();
          return self.emit('streamEnd', name, attrs);
        } else {
          if (self.element) {
            if (name === self.element.name) {
              if (self.element.parent) {
                return self.element = self.element.parent;
              } else {
                self.emit('stanza', self.element);
                return delete self.element;
              }
            } else {
              return self.emit('error', "malformed xml: at closing tag " + name);
            }
          } else {
            return self.emit('error', "malformed xml: closing tag for " + name + " before its opening tag");
          }
        }
      } else {
        return self.emit('error', "malformed xml: got a closing tag for " + name + " without a stream being started");
      }
    });
    this.parser.addListener('text', function(str) {
      if (self.element) return self.element.t(str);
    });
    this.parser.addListener('entityDecl', function() {
      this.parser.stop();
      self.emit('error', "malformed xml: no entity declarations allowed");
      return self.end();
    });
  }

  StreamParser.prototype.write = function(data) {
    var success;
    if (this.parser) {
      success = this.parser.parse(data, this.final ? true : false);
      if (!success) return this.emit('error', "xml parse error");
    }
  };

  StreamParser.prototype.end = function(data) {
    this.final = true;
    if (data) this.write(data);
    if (this.parser) this.parser.stop();
    delete this.parser;
    return this.emit('end');
  };

  return StreamParser;

})(EventEmitter);

exports.StreamParser = StreamParser;