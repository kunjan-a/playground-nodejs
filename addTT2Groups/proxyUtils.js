
var makeXML = function(name, attrs) {
  	var attr, value, xml;
  	xml = "<" + name;
  	for (attr in attrs) {
    	value = attrs[attr];
    	xml += " " + attr + "=\"" + value + "\"";
  	}
  	return xml += ">";
};

exports.makeXML = makeXML;