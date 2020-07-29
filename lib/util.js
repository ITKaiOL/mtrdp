// add utility functions to application
(function(app) {
  
  // Language utility functions
  app.__ = function(label) {
    if(app.lang) {
      const currLang = app.lang.getLang();
      if(app.strings[label] && app.strings[label][currLang]) {
        return app.strings[label][currLang];
      }
    }
    return '';
  };
  
  // abuse utility function with more functions
  app.__.l = function(lineCode) {
    if(app.lang) {
      const currLang = app.lang.getLang();
      if(app.names.lines[lineCode] && app.names.lines[lineCode][currLang]) {
        return app.names.lines[lineCode][currLang];
      }
    }
    return '';
  };
  
  app.__.s = function(stationID) {
    if(app.lang) {
      var currLang = app.lang.getLang();
      stationID = parseInt(stationID);
      if(app.names.stations[stationID] && app.names.stations[stationID][currLang]) {
        return app.names.stations[stationID][currLang];
      }
    }
    return '';
  };
  
  // DOM utilities
  // get by ID
  app._$ = function(elementID) {
    return document.getElementById(elementID);
  };
  
  // abuse function for more..
  // create and return new element
  // attributes is an object (key-value pair)
  // children is array of children, either an element or text
  app._$.create = function(tagName, attributes, children) {
    var elem = document.createElement(tagName);
    if(attributes) {
      for(var name in attributes) {
        if(attributes.hasOwnProperty(name)) {
          var value = attributes[name];
          switch(name) {
            case 'id':
            case 'checked':
            case 'className':
              elem[name] = value;
              break;
            case 'class':
              elem.className = value;
              break;
            case 'style':
              for(var sname in value) {
                if(value.hasOwnProperty(sname)) {
                  var svalue = value[sname];
                  elem.style[sname] = svalue;
                }
              }
              break;
            default:
              elem.setAttribute(name, value);
          }
        }
      }
    }
    if(children) {
      children.forEach(function(child) {
        if(child instanceof HTMLElement) {
          elem.appendChild(child);
        } else {
          elem.appendChild(document.createTextNode(child));
        }
      });
    }
    return elem;
  };
  
  // create material icons
  app._$.matIcon = function(name) {
    return app._$.create('i', { className: 'material-icons' }, [ name ]);
  };  
  
})(window.MTRDP);
