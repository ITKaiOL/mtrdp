// add global option support to the app
(function(app) {
  
  // option input elements
  options = {
//    'discount20': null,
    'daypass-10for1': null
  };
  
  const listeners = [];
  
  // initialize global options
  // async
  function init() {
    // preload libraries
    return app.load('lib/autosave.js').then(_init);
  }
  
  // real iniitialization
  // async
  function _init() {
      return new Promise(function(resolve) {
      
      const optionsDiv = app._$('options-options');

      // generate language options
      for(const option in options) {
        if(options.hasOwnProperty(option)) {
          let input, label;
          const optID = 'opt-'+option;
          
          optionsDiv.appendChild(
            app._$.create('span',null,[
              input=app._$.create('input', { id: optID, type:'checkbox', checked: true }),
              label=app._$.create('label', { 'for': optID, 'data-string': option })
            ])
          );
          options[option] = input;
          options[option].addEventListener('click', update);
          
          // initialize options from autosave
          const savedValue = app.autosave.load('option.'+option);
          if(savedValue !== null) {
            input.checked = savedValue;            
          }
        }      
      } 
  
      resolve();
    });
  }
  
  // get all options
  function getAll() {
    const values = {};
    for(const option in options) {
      if(options.hasOwnProperty(option)) {
        values[option] = options[option].checked;
      }
    }
    return values;
  }
  
  // get one 
  function get(option) {
    if(options.hasOwnProperty(option)) {
      return options[option].checked;
    }
    return null;
  }
  
  // save options and update view
  function update() {
    for(const option in options) {
      if(options.hasOwnProperty(option)) {
        app.autosave.save('option.'+option, options[option].checked);
      }
    }

    // notify all
    notifyAll();
  }
  
  // notify all
  function notifyAll() {
    listeners.forEach(function(listener) {
      listener();
    });
  }
  
  // add listener that reacts to option changes
  function addListener(listener) {
    listeners.push(listener);
  }
  // remove listener
  function removeListener(listener) {
    const l = listeners.indexOf(listener);
    if(l >= 0) {
      listeners.splice(l, 1);
    }
  }
  
  // expose language related functions
  app.options = {
    init: init,
    getAll: getAll,
    get: get,
    addListener: addListener
  };
  
})(window.MTRDP);
