// State management
(function(app) {

  // available state scope
  const scopes = [
    's',  // section option 
    'so', // section options, default false
    'do', // discount options, default true` 
  ];
  
  const currState = {};
  let listener = null;
  
  // tools to parse URI hash
  const getHash = () => {
    try {
      const obj = JSON.parse(decodeURIComponent(location.hash.substr(1)));
      if(typeof obj === 'object' && obj !== null)
        return obj;
    } catch(e) {
    }
    return {}; // return empty object for any error
  };
  
  // initialize state from URL
  const init = async () => {
    const queryObj = getHash();
    scopes.forEach((scope) => {
      if(queryObj.hasOwnProperty(scope)) {
        currState[scope] = queryObj[scope];
      }
    });

    // reload page on hashchange
    window.addEventListener('hashchange', (event)=>{ 
      if(JSON.stringify(currState) !== JSON.stringify(getHash())) {
        location.reload();
      }
    });
  };
  
  // get state
  const stateGet = (scope, key, defaultValue) => {
    if(currState.hasOwnProperty(scope)) {
      if(key && currState[scope].hasOwnProperty(key)) {
        return currState[scope][key];
      } else {
        return currState[scope];
      }
    }
    return defaultValue || null;
  };
  
  // get state under a scope
  const stateGetAll = (scope) => {
    if(currState.hasOwnProperty(scope)) {
      if(typeof currState[scope] === 'object' && currState[scope] !== null) {
        return Object.assign({}, currState[scope]);
      } else {
        return currState[scope];
      }      
    }
    return [];
  };
  
  // build query string from state 
  const getQuery = () => {
    return encodeURIComponent(JSON.stringify(currState));
  }
  
  // set state and update URL
  // option trueProp: filter value object and keep only those with true values
  // option defaultTrue: filter true values
  const stateSet = (scope, key, value, options) => {
    options = options || {};
    if(options.hasOwnProperty('trueProp')) {
      const newValue = {};
      for(const key in value) {
        if(value.hasOwnProperty(key) && value[key]) {
          newValue[key] = value[key];
        }
      }
      if(Object.keys(newValue).length > 0) {
        value = newValue;
      } else {
        value = null;
      }
    }
    if(key) {
      if(!currState.hasOwnProperty(scope)) {
        currState[scope] = {};
      }
      if(value !== null) {
        if(options.defaultTrue && value) {
          delete currState[scope][key];
        } else {
          currState[scope][key] = value;
        }
      } else {
        delete currState[scope][key];
      }
    } else {
      currState[scope] = value;
    }
    
    // if switching section without option, load from storage
    if(scope === 's' && !currState.hasOwnProperty('so')) {
      try {
        const savedParams = JSON.parse(localStorage.getItem('mtrdp_'+currState.s));
        if(typeof savedParams === 'object' && savedParams !== null) {
          currState['so'] = savedParams;
        }
      } catch(e) {
      }
    }
    
    // store section option to localstorage
    if(scope === 'so') {
      localStorage.setItem('mtrdp_'+currState.s, JSON.stringify(currState.so));
    }

    location.hash = '#'+getQuery();
  };
  
  // clear state to make URL shorter if possible
  const stateClear = (scope, key) => {
    if(key) {
      if(currState.hasOwnProperty(scope)) {
        delete currState[scope][key];
      }
    } else {
      delete currState[scope];
    }
  };
  
  app.STATE = {
    init: init,
    get: stateGet,
    getAll: stateGetAll,
    set: stateSet,
    clear: stateClear,
  };
  
}(window.MTRDP));
