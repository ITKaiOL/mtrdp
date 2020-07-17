// main view functions of the app
(function(app) {

  var currentSection = null;
  var sectionsAvailable = ['round-trip', 'route-planner'];
  var sections = {};
  
  // initialize view
  // async
  function init() {
    return Promise.all([
      app.load('lib/autosave.js'),
      app.load('lib/languages.js')
         .then(function() { app.lang.init(); })
         .then(function() { app.lang.addListener(update); }),
      app.load('lib/options.js')
         .then(function() { app.options.init(); }),
      initSections(sectionsAvailable),
    ]).then(initView);
  }
  
  // initialize sections elements
  // async
  function initSections(sections) {
    var promises = sections.map(function(section) {
      return app.load('lib/views/'+section+'/'+section+'.js');
    });
    
    return Promise.all(promises).then(_initSections);
  }
  
  // initialize UI for sections after loading sections js
  function _initSections() {
    return new Promise(function(resolve) {
      var menuDiv = app._$('menu');
      sectionsAvailable.forEach(function(section) {
        // generate button in menu
        var button = app._$.create('button', { 'data-string': section, 'data-for': section });
        menuDiv.appendChild(button);
        button.addEventListener('click', function(event) {
          toggleSection(event.target.getAttribute('data-for')).then();
        });
        
        var sectionDiv = app._$.create('section', { id: section, style: { display: 'none' } });
        document.body.appendChild(sectionDiv);
        
        sections[section] = {
          button: button,
          div: sectionDiv,
          loaded: false
        };        
      });
<<<<<<< HEAD
      
      initFooter();
=======
      document.body.appendChild(app._$.create('div', { id: 'source-links' }, [
        app._$.create('a', { href: app.config.sourceLink }, [
          'Github'
        ])
      ]));
>>>>>>> d3eced94c0f74f54a5308cf0931f364785dc512f

      update();
      resolve();
    });
  }
  
  // attach footer
  function initFooter() {
    document.body.appendChild(app._$.create('div', { id: 'source-links' }, [
      app._$.create('a', { href: app.config.sourceLink }, [
        'Github'
      ]),
      app._$.create('br'),
      app._$.create('span', { 'data-string': 'data-time' }),
      app.config.dataTime
    ]));
  }

  
  // initialize view after elements are ready
  // async
  function initView() {
    return new Promise(function(resolve) {
      // load autosave if available
      var savedSection = app.autosave.load('section');
      if(!sections.hasOwnProperty(savedSection)) {
        savedSection = sectionsAvailable[0];
      }
      toggleSection(savedSection).then(resolve);
    });
  }
  
  // schedule a view update
  // will collapse multiple requests
  var updateTimer = null;
  function update() {
    if(!updateTimer) {
      updateTimer = setTimeout(_update, 0);
    }
  }
  
  // update view (real)
  function _update() {
    // reset updateTimer
    updateTimer = null;
  
    var elements = document.querySelectorAll('[data-string]');
    for(var e = 0; e < elements.length; ++e) {
      var element = elements[e];
      element.textContent = app.__(element.getAttribute('data-string'));
    }

    var elements = document.querySelectorAll('[data-line]');
    for(var e = 0; e < elements.length; ++e) {
      var element = elements[e];
      element.textContent = app.__.l(element.getAttribute('data-line'));
    }
    
    var elements = document.querySelectorAll('[data-station]');
    for(var e = 0; e < elements.length; ++e) {
      var element = elements[e];
      element.textContent = app.__.s(element.getAttribute('data-station'));
    }
  }
  
  // toggle section
  // async
  function toggleSection(section) {
    return new Promise(function(resolve) {
      // save section
      app.autosave.save('section', section);
      
      // load if toggle the first time
      if(!sections[section].loaded) {
        sections[section].loaded = true;
        app.sections[section].init(sections[section].div).then(function() {
          _toggleSection(section);
          resolve();
        });
        app.sections[section].addListener(update);
        
      } else {
        _toggleSection(section);
        resolve();
      }
    });
  }
  // actually toggle section
  function _toggleSection(section) {
    if(currentSection) {
      sections[currentSection].div.style.display = 'none';
      sections[currentSection].button.className = '';
    }
    
    currentSection = section;
    sections[currentSection].div.style.display = 'flex';
    sections[currentSection].button.className = 'current';
  }

  // hide loading screen
  function hideLoading() {
    app._$('loading').style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // expose features
  app.view = {
    init: init,
    hideLoading: hideLoading
  };
  
})(window.MTRDP);