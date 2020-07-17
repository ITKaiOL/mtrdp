// support auto-save/load from local storage
(function(app) {
  
  var storage = window.localStorage;
  
  function save(key, value) {
    storage.setItem(key, JSON.stringify(value));
  }
  
  function load(key) {
    var item = storage.getItem(key);
    try {
      return JSON.parse(item);
    } catch(e) {
      return null;
    }
  }
  
  // expose functions if localStorage is supported
  if(storage) {
    app.autosave = {
      save: save,
      load: load
    };
  } else {
    var nullFunc = function() {};
    app.autosave = {
      save: nullFunc,
      load: nullFunc
    };
  }
  
})(window.MTRDP);
