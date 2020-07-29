// add language support to the app
(function(app) {
  
  // language setings
  app.languages = {
    zh: '中',
    en: 'en'
  };
  
  // current language
  let currLang = null;
  const options = {};
  
  const listeners = [];
  
  // initialize lanaguage options
  // async
  function init() {
    return app.load('lib/autosave.js').then(_init);
  }
  // real iniitialization
  // async
  function _init() {
    return new Promise(function(resolve) {
      
      const langOptionsDiv = app._$('lang-options');

      // generate language options
      for(const lang in app.languages) {
        if(app.languages.hasOwnProperty(lang)) {
          const optID = 'lang-'+lang;
          const input = app._$.create('input', { id: optID, type:'radio', name:'lang', value: lang });
          const label = app._$.create('label', { 'for': optID }, [app.languages[lang]]);
          langOptionsDiv.appendChild(
            app._$.create('span',null,[
              input, label
            ])
          );
          options[lang] = input;
          options[lang].addEventListener('click', function(event) {
            setLanguage(event.target.value);
          });
        }
      }
      
      // determine default language, always 'zh' unless language is 'en'
      // use saved config in localstorage if available
      const sysLang = (window.navigator.userLanguage || window.navigator.language).substring(0, 2);
      const prevLang = app.autosave.load('lang');
      if(app.languages.hasOwnProperty(prevLang)) {
        setLanguage(prevLang);
      } else {
        setLanguage(sysLang);      
      }
      resolve();
    });
  }
  
  // set language to one of the availables. 
  function setLanguage(newLang) {
    if(!app.languages.hasOwnProperty(newLang)) {
      newLang = app.languages[0];
    }
    
    if(currLang !== newLang) {
      currLang = newLang;
      app.autosave.save('lang', currLang);
      
      for(const lang in app.languages) {
        if(app.languages.hasOwnProperty(lang)) {
          options[lang].checked = (lang === currLang);
        }
      }
      
      // notify all
      notifyAll();
    }
    
  }

  // notify all
  function notifyAll() {
    listeners.forEach(function(listener) {
      listener();
    });
  }
  
  // add listener that reacts to language changes
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
  
  // get current language
  function getLang() {
    return currLang;
  }
  
  // expose language related functions
  app.lang = {
    init: init,
    addListener: addListener,
    getLang: getLang
  };
  
})(window.MTRDP);
