(function(app) {
  
  const sectionName = 'route-planner';

  // UI containers
  let rootElement = null;
  let routeRootElement = null;
  
  const listeners = [];
  
  // init view
  function init(element) {
    rootElement = element;
    
    return Promise.all([
      app.load('lib/views/components/station-selector/station-selector.js'),
      app.load('lib/views/route-planner/route-planner.css'),
      app.load('lib/fare-calculator.js'),
    ]).then(function() { _init(); });
  }
  
  // initialization after loading resources
  function _init() {
    rootElement.appendChild(routeRootElement=app._$.create('div', { className: 'routes' }));
    
    // add a reset button
    rootElement.appendChild(app._$.create('div', { className: 'bottom-action' }, [
      resetButton=app._$.create('button', { className: 'btn-reset-all' }, [
        app._$.create('span', { 'data-string': 'reset-all' })
      ])
    ]));

    resetButton.addEventListener('click', removeAllRoute);
    
    // enable first route
    addRoute();
    // load route from autosave if exists
    loadRoutes(); 
   
    // register listener to global options
    app.options.addListener(update);
  }
  
  // current routes
  const routes = [];
  let routeCounter = 0;
  
  // add new route selection
  function addRoute() {
    
    // absolute counter for id generation
    routeCounter++;
    
    // route object
    const route = {
      root: null,
      index: null,
      delete: null,
      selectors: {
        from: null,
        to: null
      },
      options: {
        earlyBird: null
      },
      resultDiv: {
        octopus: null,
        dayPass: null,
        subtotal: null
      }
    };
    
    const selectorsDiv = app._$.create('div', { className: 'selectors' });
    const optionEarlyBirdID = 'route-'+routeCounter+'-opt-early';
    const removeButton = app._$.create('button', { className: 'remove' }, [
      app._$.matIcon('delete')
    ]);

    routeRootElement.appendChild(route.root=app._$.create('div', { className: 'route' }, [
      route.index=app._$.create('div', { className: 'index'}, [
        routes.length + 1
      ]),
      route.delete=app._$.create('div', { className: 'remove', style: { display: 'none' } }, [
        removeButton
      ]),
      app._$.create('div', { className: 'selectors-options' }, [
        selectorsDiv,
        app._$.create('div', { className: 'options' }, [
          app._$.create('span', null, [
            route.options.earlyBird=app._$.create('input', { type: 'checkbox', id: optionEarlyBirdID }),
            app._$.create('label', { 'data-string': 'early-bird', 'for': optionEarlyBirdID })
          ])
        ])
      ]),
      app._$.create('div', { className: 'results' }, [
        route.resultDiv.octopus=app._$.create('div', { className: 'octopus' }),
        route.resultDiv.dayPass=app._$.create('div', { className: 'daypass' }),
        route.resultDiv.subtotal=app._$.create('div', { className: 'subtotal' }),
      ])
    ]));
    
    // "From" selector
    route.selectors.from = new app.StationSelector('from-station');
    route.selectors.from.attach(selectorsDiv, update);
    
    // arrow
    selectorsDiv.appendChild(app._$.create('span', null, [' → ']));
    
    // "To" selector
    route.selectors.to = new app.StationSelector('to-station');
    route.selectors.to.attach(selectorsDiv, update);   
    
    // enable early bird option    
    route.options.earlyBird.addEventListener('click', update);    

    removeButton.addEventListener('click', function() {
      removeRoute(route);
    });
    
    routes.push(route);
    notifyAll();
  }
  
  // remove route 
  function removeRoute(route) {
    const r = routes.indexOf(route);
    if(r >= 0) {
      const route = routes[r];
      routes.splice(r, 1);
      
      // update providers
      updateProviders();
      
      // free up resources
      for(const s in route.selectors) {
        if(route.selectors.hasOwnProperty(s)) {
          route.selectors[s].free();
        }
      }
      route.root.parentNode.removeChild(route.root);
    }
    update();
  }
  
  // remove all routes
  function removeAllRoute() {
    // remove each routes
    routes.forEach(function(route) {
      // free all resources
      for(const s in route.selectors) {
        if(route.selectors.hasOwnProperty(s)) {
          route.selectors[s].free();
        }
      }
      route.root.parentNode.removeChild(route.root);
    });
    routes = [];
    // add back the initial route
    addRoute();
    update();
  }
  
  function updateProviders() {
    // no providers for the first one
    routes[0].selectors.from.setProvider(null);
    routes[0].selectors.to.setProvider(null);
    
    // set other providers
    for(let r = 1; r < routes.length; ++r) {
      routes[r].selectors.from.setProvider(routes[r-1].selectors.to);
      routes[r].selectors.to.setProvider(routes[0].selectors.from);
    }
  }
  
  // update route
  function update() {
    
    saveRoutes();
    
    // subtotals
    const subtotals = {
      octopus: 0,
      dayPass: 0
    };
    if(app.options.get('daypass-10for1')) {
      subtotals.dayPass += app.config.dayPass['10for1Price'];
    } else {
      subtotals.dayPass += app.config.dayPass.price;
    }
    
    const options = app.options.getAll();

    // process and show the result of each route
    routes.forEach(function(route, index) {
      
      // prepare options
      const stationFrom = route.selectors.from.getValue();
      const stationTo = route.selectors.to.getValue();
      const routeOptions = {
        discount20: options.discount20,
        earlyBird: route.options.earlyBird.checked
      };
      
      // update index
      route.index.textContent = index + 1;
      // enable remove button if not the last route
      if(index !== routes.length - 1) {
        route.delete.style.display = 'block';
      } else {
        route.delete.style.display = 'none';
      }
      
      // populate result if both stations selected
      if(stationFrom && stationTo) {
        const summary = app.fareCalculator.getSummary(stationFrom, stationTo, routeOptions);
        subtotals.octopus += summary.octopus.fare;
        
        // octopus
        route.resultDiv.octopus.innerHTML = '';
        route.resultDiv.octopus.appendChild(app._$.create('div', { className:'trip-desc' }, [
          app._$.create('span', { 'data-string': 'octopus' }),
          app._$.create('span', null, ['$'+summary.octopus.fare.toFixed(1)])
        ]));
        
        route.resultDiv.octopus.appendChild(app._$.create('div', { className:'trip-desc small' }, 
          summary.octopus.render()
        ));
        route.resultDiv.octopus.style.display = 'block';
        
        // daypass
        route.resultDiv.dayPass.innerHTML = '';
        if(summary.dayPass) {
          subtotals.dayPass += summary.dayPass.fare;

          route.resultDiv.dayPass.appendChild(app._$.create('div', { className:'trip-desc' }, [
            app._$.create('span', { 'data-string': 'daypass' }),
            app._$.create('span', null, ['$'+summary.dayPass.fare.toFixed(1)])
          ]));
          
          route.resultDiv.dayPass.appendChild(app._$.create('div', { className:'trip-desc small' }, 
            summary.dayPass.render()
          ));
        } else {
          // need to use octopus if day pass not suitable
          subtotals.dayPass += summary.octopus.fare;
          
          route.resultDiv.dayPass.appendChild(app._$.create('div', { className:'trip-desc' }, [ 
            app._$.create('span', { 'data-string': 'daypass-nouse' }),
          ]));
          
        }
        route.resultDiv.dayPass.style.display = 'block';
        
        // subtotal
        route.resultDiv.subtotal.innerHTML = '';
        route.resultDiv.subtotal.appendChild(app._$.create('div', { className:'trip-desc' }, [
          app._$.create('span', { 'data-string': 'daypass-total' }),
          app._$.create('span', null, ['$'+subtotals.dayPass.toFixed(1)])
        ]));
        
        route.resultDiv.subtotal.appendChild(app._$.create('div', { className:'trip-desc' }, [
          app._$.create('span', { 'data-string': 'not-use' }),
          app._$.create('span', null, ['$'+subtotals.octopus.toFixed(1)])
        ]));
        
        if(Math.round(subtotals.dayPass*100) < Math.round(subtotals.octopus*100)) {
          route.resultDiv.subtotal.appendChild(app._$.create('div', { className:'trip-desc buy-pass' }, [
            app._$.create('span', { 'data-string': 'buy-daypass' })
          ]));
        }
        route.resultDiv.subtotal.style.display = 'block';
        
      }
    });
  
    // enable next route if last route is filled
    if(routes.length > 0) {
      const lastRoute = routes[routes.length-1];
      if(lastRoute.selectors.from.getValue() && lastRoute.selectors.to.getValue()) {
        addRoute();
        routes[routes.length-1].selectors.from.select(lastRoute.selectors.to.getValue());
        routes[routes.length-1].selectors.from.setProvider(lastRoute.selectors.to);
        routes[routes.length-1].selectors.to.setProvider(routes[0].selectors.from);
      }
    }
  
    notifyAll();
  }
  
  // notify all
  function notifyAll() {
    listeners.forEach(function(listener) {
      listener();
    });
  }
  
  // save current route in local storage
  function saveRoutes() {
    // generate object for saving
    const routesData = routes.map(function(route) {
      return {
        from: route.selectors.from.getValue(),
        to: route.selectors.to.getValue(),
        options: { earlyBird: route.options.earlyBird.checked }
      };
    });
    
    app.autosave.save(sectionName+'.routes', routesData);    
  }
  
  // load route from storage
  function loadRoutes() {
    const routesData = app.autosave.load(sectionName+'.routes');
    if(routesData) {
      // selector should automatically trigger new route
      routesData.forEach(function(route, index) {
        routes[index].options.earlyBird.checked = route.options.earlyBird;
        if(route.from) {
          routes[index].selectors.from.select(route.from);
        }
        if(route.to) {
          routes[index].selectors.to.select(route.to);
        }
      });
    }
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
  
  app.sections['route-planner'] = {
    init: init,
    addListener: addListener
  };  

})(window.MTRDP);
