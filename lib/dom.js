// DOM utilities
(function(app) {
  
  // get by ID
  const DOMget = (elementID) => {
    return document.getElementById(elementID);
  };
  
  // get by CSS selector
  const DOMgetAll = (selector) => {
    return document.querySelectorAll(selector);
  };
  
  // create and return new element
  // attributes is an object (key-value pair)
  // children is array of children, either an element or text
  const DOMcreate = (tagName, attributes, children) => {
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
  const matIcon = (name) => {
    return DOMcreate('i', { className: 'material-icons' }, [ name ]);
  };  
  
  app.DOM = {
    get: DOMget,
    getAll: DOMgetAll,
    create: DOMcreate,
    matIcon: matIcon
  };
  
}(window.MTRDP));
