// Language utilities
(function(app) {
  
  // available languages, internal identifies vs presentations
  const languages = { 'en':'en', 'zh':'中' };

  // current language
  let currLang = 'zh';
  
  // initialize languages
  const init = async () => {
    await app.loadAll([
      'STR',   // get standard strings
      'DOM',   // for DOM manipulation
      'LINES', // line informations
    ]);
    
    const langMap = {
      en: 'nameEN',
      zh: 'nameZH'
    };
    
    const sInfo = app.LINES.getInfo()
    for(const sID in sInfo) {
      if(sInfo.hasOwnProperty(sID)) {
        for(const l in languages) {
          if(languages.hasOwnProperty(l)) {
            if(!app.STR[l].mtr.hasOwnProperty(sID)) {
              app.STR[l].mtr[sID] = sInfo[sID][langMap[l]];
            }
          }
        }
      }
    }

  };
  
  // get current language
  const langGet = () => currLang;
  
  // set current language
  // update all translation
  const langSet = (value) => {
    if(languages.hasOwnProperty(value)) {
      currLang = value;
      const langElements = document.querySelectorAll('[data-lang-term]');
      for(let i = 0; i < langElements.length; ++i) {
        const term = langElements[i].getAttribute('data-lang-term');
        const scope = langElements[i].getAttribute('data-lang-scope');
        const value = langTranslate(term, scope);
        langElements[i].textContent = value;
      }
    }
  };
  
  // build translatable items
  const langCreate = (term, scope) => {
    return app.DOM.create('span', { 'data-lang-term': term, 'data-lang-scope': scope }, [
      langTranslate(term, scope)
    ]);
  };
  
  // update term in element
  const langUpdate = (element, term, scope) => {
    element.setAttribute('data-lang-term', term);
    element.setAttribute('data-lang-scope', scope);
    element.textContent = langTranslate(term, scope);
  };
    
  // do translation
  const langTranslate = (term, scope) => {
    if(app.STR.hasOwnProperty(currLang) && app.STR[currLang]) {
      if(scope) { // find term with specific scope
        if(app.STR[currLang].hasOwnProperty(scope)) {
          if(app.STR[currLang][scope].hasOwnProperty(term)) {
            return app.STR[currLang][scope][term];
          }
        }
      } else { // find term with unspecific scope
        for(const scope in app.STR[currLang]) {
          if(app.STR[currLang].hasOwnProperty(scope)) {
            if(app.STR[currLang][scope].hasOwnProperty(term)) {
              return app.STR[currLang][scope][term];
            }
          }
        }
      }
    }
    
    // return the original term if not translated
    return term;
  }
  
  app.LANG = {
    init: init,
    languages: languages,
    get: langGet,
    set: langSet,
    create: langCreate,
    update: langUpdate,
    _: langTranslate // main translate tool
  };
  
}(window.MTRDP));
