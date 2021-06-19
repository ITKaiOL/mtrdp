// view handling tools
(function(app) {
  
  // available views
  const sections = {
    'overview': {
      url: 'views/overview/overview.js',
      name: 'Round-trip overview'
    },
    'planner':  {
      url: 'views/planner/planner.js',
      name: 'Route planner'
    }
  };
  const defaultSection = 'overview';
  let currSection = null;

  // (pre-)initialize view
  const init = async () => {
    // load basic view,
    await app.loadAll([
      'LANG',  // language 
      'OPT',   // discount options 
      'DOM',   // for DOM manipulation
      'STATE', // for state update
    ]);
    await initView();
  };
  
  // initialize basic UI
  const initView = async () => {
    app.DOM.get('title').appendChild(app.LANG.create('Day-pass Analyser', 'title'))
    app.DOM.get('title').appendChild(app.DOM.create('a', { href: 'https://github.com/ITKaiOL/mtrdp#readme' }, [
      app.DOM.matIcon('info'),
      app.LANG.create('Info', 'title')
    ]));
    
    initLangOpt();
    initDiscountOpt();
    initMenu();
    initFooter();
    
    await updateView();
  };
  
  // initialize language options
  const initLangOpt = () => {
    const languages = app.LANG.languages;
    const langOptionsDiv = app.DOM.get('lang-options');
    const currLang = app.LANG.get();
    for(const lang in languages) {
      if(languages.hasOwnProperty(lang)) {
        const optID = 'lang-'+lang;
        const input = app.DOM.create('input', { id: optID, type:'radio', name:'lang', value: lang });
        const label = app.DOM.create('label', { 'for': optID }, [app.LANG.languages[lang]]);
        langOptionsDiv.appendChild(
          app.DOM.create('span',null,[
            input, label
          ])
        );
        if(currLang === lang) {
          input.checked = true;
        }
        input.addEventListener('click', function(event) {
          app.LANG.set(event.target.value);
        });
      }
    }
  };
  
  // initialize global discount options
  const initDiscountOpt = () => {
    const discounts = app.OPT.discounts;
    const optOptionsDiv = app.DOM.get('options-options');
    for(const disCode in discounts) {
      if(discounts.hasOwnProperty(disCode)) {
        const disName = discounts[disCode].name;
        const optID = 'opt-'+disCode;
        const input = app.DOM.create('input', { id: optID, type:'checkbox', value: disCode });
        const label = app.DOM.create('label', { 'for': optID }, [app.LANG.create(disName, 'discount')]);
        optOptionsDiv.appendChild(
          app.DOM.create('span',null,[
            input, label
          ])
        );
        if(app.OPT.get(disCode)) {
          input.checked = true;
        }
        input.addEventListener('click', function(event) {
          app.OPT.set(event.target.value, event.target.checked);
          updateView();
        });
      }
    }
  };
  
  // initialize section menu
  const initMenu = () => {
    const menuDiv = app.DOM.get('menu');
    for(const section in sections) {
      if(sections.hasOwnProperty(section)) {
        const button = app.DOM.create('button', { 'data-string': section, 'data-for': section }, [
          app.LANG.create(sections[section].name, 'title')
        ]);
        menuDiv.appendChild(button);
        button.addEventListener('click', function(event) {
          app.STATE.clear('so');
          loadSection(section);
        });     
      }
    }
  };

  // initialize footer
  const initFooter = () => {
    document.body.appendChild(app.DOM.create('div', { id: 'source-links' }, [
      app.DOM.create('a', { href: app.CONF.source }, [
        'Github'
      ]),
      app.DOM.create('br'),
      app.LANG.create('Data date', 'title'),
      ': ',
      app.CONF.date
    ]));
  }
  
  // hide loading screen
  const hideLoading = () => {
    app.DOM.get('loading').style.display = 'none';
    document.body.style.overflow = 'auto';
  };
  
  // load section into view
  const loadSection = async (name) => {
    currSection = name;
    app.STATE.set('s', null, name);
    const url = sections[name].url;
    
    // clear button state
    const buttons  = document.querySelectorAll('#menu button');
    for(let b = 0; b < buttons.length; ++b) {
      buttons[b].classList.remove('current');
    }

    app.DOM.get('content').innerHTML = '';
    
    await app.load(url);  
    document.querySelector('button[data-for="'+name+'"]').classList.add('current');
    await app.VIEW.sections[name].init();
  };
  
  // update view from current state
  const updateView = async () => {
    // determin current section
    let stateSection = app.STATE.get('s');
    if(!sections.hasOwnProperty(stateSection)) {
      stateSection = defaultSection;
    }
    if(currSection !== stateSection) {
      await loadSection(stateSection);
    } else {
      app.VIEW.sections[currSection].update()
    }
  }
  
  app.VIEW = {
    init: init,
    sections: {},
    hideLoading: hideLoading,
    loadSection: loadSection,
  };
  
}(window.MTRDP));
