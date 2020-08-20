// support auto-save/load from local storage
(function(app) {
  
  // dummy storage object in case local storage is not available
  const nullStorage = {
    getItem: function() { return null },
    setItem: function() { }
  };
  const storage = window.localStorage?window.localStorage:nullStorage;
  const currentSetting = {};
  
  function saveAll() {
    for(const key in currentSetting) {
      if(currentSetting.hasOwnProperty(key)) {
        storage.setItem(key, JSON.stringify(currentSetting[key]));
      }
    }
    updateHash();
  }
  
  function save(key, value) {
    storage.setItem(key, JSON.stringify(value));
    currentSetting[key] = value;
    updateHash();
  }
  
  function load(key) {
    if(currentSetting.hasOwnProperty(key)) {
      return currentSetting[key];
    }
    const item = storage.getItem(key);
    let value;
    try {
      value = JSON.parse(item);
      currentSetting[key] = value;
      updateHash();
    } catch(e) {
      value = null;
    }
    return value;
  }
  
  function updateHash() {
    // construct the hash string of the current state
    let section = null;
    const hashParts = [];
    
    // first the current section
    if(currentSetting.hasOwnProperty('section')) {
      section = currentSetting.section;
    }
    hashParts.push(section);
    
    // then the global options    
    for(const key in currentSetting) {
      const keyParts = key.split('.');
      if(keyParts[0] === 'option' && currentSetting[key] !== null) {
        hashParts.push(keyParts.slice(1).join('.'));
        hashParts.push(encodeURIComponent(currentSetting[key]));
      }
    }
    // add empty value as separator
    hashParts.push(null);
    
    // then the section options if section is available
    if(section) {
      for(const key in currentSetting) {
        const keyParts = key.split('.');
        if(keyParts[0] === section && currentSetting[key] !== null) {
          hashParts.push(keyParts.slice(1).join('.'));
          hashParts.push(encodeURIComponent(JSON.stringify(currentSetting[key])));
        }
      }
    }
    
    location.hash = '/'+hashParts.join('/');
  }
  
  // get settings from hash
  function readHash() {
    _readHash();
    saveAll();
  }
  // get settings without saving
  function _readHash() {
    const hashParts = location.hash.split('/');
    let section = null;
    
    // read section
    if(hashParts[1] !== '') {
      section = hashParts[1];
      currentSetting.section = section;
    }
    
    // read options
    let i = 2;
    while(hashParts[i] !== '' && i < hashParts.length) {
      const value = decodeURIComponent(hashParts[i+1]);
      if(value === 'null') {
        currentSetting['option.'+hashParts[i]] = null;
      } else if(value === 'true') {
        currentSetting['option.'+hashParts[i]] = true;
      } else if(value === 'false') {
        currentSetting['option.'+hashParts[i]] = false;
      } else if(isNaN(value)) {
        currentSetting['option.'+hashParts[i]] = value;
      } else {
        currentSetting['option.'+hashParts[i]] = parseInt(value);
      }
      i += 2;
    }
    // skip empty separator
    ++i;
    
    // read section optionsDiv
    if(section) {
      while(hashParts[i] !== '' && i < hashParts.length) {
        currentSetting[section+'.'+hashParts[i]] = JSON.parse(decodeURIComponent(hashParts[i+1]));
        i += 2;
      }
    }

    saveAll();
  }
  
  // hash change handler, reload page if manual URL changing is detected
  function rehash() {
    const current = JSON.stringify(currentSetting);
    _readHash();
    const updated = JSON.stringify(currentSetting);
    if(current !== updated) {
      location.reload();
    }
  }
  
  // expose functions
  app.autosave = {
    save: save,
    load: load
  };
  
  // initial read from hash
  readHash();
  // hash change 
  window.addEventListener('hashchange', rehash);
  
})(window.MTRDP);
