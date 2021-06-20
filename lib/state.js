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
  
  // tools to parse URI hash
  const getHash = () => {
    try {
      const obj = decodeJSONURIComponent(location.hash.substr(1));
      if(typeof obj === 'object' && obj !== null)
        return obj;
    } catch(e) {
    }
    return {}; // return empty object for any error
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
    return encodeJSONURIComponent(currState);
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
  
  // Escape JSON strings to a more readible form
  // swap characters
  // '  <=> "
  // {...} <=> (..)
  // escape all characters except:
  // 0-9, a-z, A-Z
  // ?/:@-._~!&'()*+,;=
  const FRAG_VALID_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ?/:@-._~!&'()*+,;=\"[]";
  const FRAG_SWAP_CHARS = {
    '"': "'",
    "'": '"',
    '{': '(',
    '}': ')',
    '(': '{',
    ')': '}',
  };
  const FRAG_ESCAPE_CHARS = {
    '/': '/',
    '"': "'",
    '[': '(',
    ']': ')'
  };
  const FRAG_UNESCAPE_CHARS = Object.keys(FRAG_ESCAPE_CHARS).reduce((ret, key) => {
    ret[FRAG_ESCAPE_CHARS[key]] = key;
    return ret;
  }, {});
  
  // encoder
  const encodeJSONURIComponent = (obj) => {
    const strJSON = JSON.stringify(obj);
    const result = [];
    for(let ch of strJSON) {
      // swap characters
      if(FRAG_SWAP_CHARS.hasOwnProperty(ch)) {
        ch = FRAG_SWAP_CHARS[ch];
      }
      if(FRAG_VALID_CHARS.indexOf(ch) >= 0) {
        if(FRAG_ESCAPE_CHARS.hasOwnProperty(ch)) {
          // special escape
          result.push('/');
          result.push(FRAG_ESCAPE_CHARS[ch]);
        } else {
          result.push(ch);
        }
      } else {
        // normal escape
        result.push(encodeURIComponent(ch));
      }
    };
    return result.join('');
  };
  // decoder
  const decodeJSONURIComponent = (str) => {
    const result = [];
    let escaped = false;
    str = decodeURIComponent(str);
    
    // special escape
    for(let ch of str) {
      if(escaped) { 
        if(FRAG_UNESCAPE_CHARS.hasOwnProperty(ch)) {
          result.push(FRAG_UNESCAPE_CHARS[ch]);
        }
        escaped = false;
      } else if(ch === '/') {
        escaped = true;
      } else {
        result.push(ch);
      }
    };
    
    // normal escape
    result.forEach((ch, idx) => {
      if(FRAG_SWAP_CHARS.hasOwnProperty(ch)) {
        result[idx] = FRAG_SWAP_CHARS[ch];
      }
    });

    return JSON.parse(result.join(''));
  };
  
  app.STATE = {
    init: init,
    get: stateGet,
    getAll: stateGetAll,
    set: stateSet,
    clear: stateClear,
  };
  
}(window.MTRDP));
