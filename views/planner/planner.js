// Planner view 
// app.VIEW must be loaded first
(function(app) {

  let routes = [];
  let routesDiv = null;
  
  // (pre-)initialize view
  const init = async () => {
    await app.loadAll([
      'views/planner/planner.css',
      'StationSelector',
      'DiscountSelector',
      'DOM',
      'LANG',
      'STATE', // for section options, managed by section
      'OPT',   // for global options
      'FARES',
      'TripWidget',
    ]);
    
    // clear routes
    routes = [];
    
    // main controls
    const contentDiv = app.DOM.get('content');
    contentDiv.setAttribute('data-section', 'planner');
    
    routesDiv = app.DOM.create('div', { className: 'routes'});
    const resetButton = app.DOM.create('button', { className: 'btn-reset-all' }, [
      app.LANG.create('Reset all', 'planner')
    ]);    
    const resetDiv = app.DOM.create('div', { className: 'bottom-action'}, [
      resetButton
    ]);
    resetButton.addEventListener('click', () => {
      removeAllRoute();
    });
    
    contentDiv.appendChild(routesDiv);
    contentDiv.appendChild(resetDiv);
    
    // update route
    update();
    
  };
  
  // add new route to section
  const addRoute = () => {
    const route = {
      root: app.DOM.create('div', { className: 'route' }),
      selectors: {
        from: new app.StationSelector('From'),
        to: new app.StationSelector('To'),
      },
      options: new app.DiscountSelector(),
      indexDiv: app.DOM.create('div', { className: 'index' }, [
        routes.length + 1
      ]),
      deleteDiv: app.DOM.create('div', { className: 'remove', style: 'display: none' } ),
      resultDivs: {
        octopus: app.DOM.create('div', { className: 'octopus' }),
        dayPass: app.DOM.create('div', { className: 'daypass' }),
        subtotal: app.DOM.create('div', { className: 'subtotal' }),
      }
    };
    
    if(routes.length > 0) {
      // auto select "From" starting from the second route
      route.selectors.from.select(routes[routes.length-1].selectors.to.getValue());
    }
    
    routes.push(route);
    
    const removeButton = app.DOM.create('button', { className: 'remove' }, [
      app.DOM.matIcon('delete')
    ]);
    removeButton.addEventListener('click', () => {
      removeRoute(route);
    });
    route.deleteDiv.appendChild(removeButton);
    
    const selectorsDiv = app.DOM.create('div', { className: 'selectors' });
    const optionsDiv = app.DOM.create('div', { className: 'options' });
    
    routesDiv.appendChild(route.root);
    route.root.appendChild(route.indexDiv);
    route.root.appendChild(route.deleteDiv);
    route.root.appendChild(app.DOM.create('div', { className: 'selectors-options' }, [
      selectorsDiv,
      optionsDiv
    ]));
    route.root.appendChild(app.DOM.create('div', { className: 'results' }, [
      route.resultDivs.octopus,
      route.resultDivs.dayPass,
      route.resultDivs.subtotal
    ]));
        
    route.selectors.from.attach(selectorsDiv, updateResult);
    selectorsDiv.appendChild(app.DOM.create('span', {}, ['→']));
    route.selectors.to.attach(selectorsDiv, updateResult);
    route.options.attach(optionsDiv, updateResult);
    
    updateRoute();
  };
  
  // remove route 
  const removeRoute = (route) => {
    const index = routes.indexOf(route);
    if(index >= 0) {
      const route = routes[index];
      routes.splice(index, 1);
      route.root.parentNode.removeChild(route.root);
      updateRoute();
    }
    updateResult();
  };
  
  // removeAllRoute
  const removeAllRoute = () => {
    routes.forEach(route => {
      route.root.parentNode.removeChild(route.root);
    });
    routes = [];
    addRoute();
    updateRoute();
  };
  
  // update route after changes 
  const updateRoute = () => {
    routes.forEach((route, idx) => {
      route.indexDiv.innerHTML = (idx+1);
      if(idx === 0) {
        route.selectors.from.setProvider(null);
        route.selectors.to.setProvider(null);
      } else {
        route.selectors.from.setProvider(routes[idx-1].selectors.to);
        route.selectors.to.setProvider(routes[0].selectors.from);
      }
      if(idx === routes.length-1) {
        route.deleteDiv.style.display = 'none';
      } else {
        route.deleteDiv.style.display = 'block';
      }
    });
    updateResult();
  };
  
  // update view from current option
  const update = () => {
    const compactStates = app.STATE.get('so', 'r');
    removeAllRoute();
    if(compactStates && Array.isArray(compactStates)) {
      for(let c = 1; c < compactStates.length; ++c) {
        addRoute();
      }
      compactStates.forEach((state, idx) => {
        if(state.f) {
          routes[idx].selectors.from.select(state.f);
        }
        if(state.t) {
          routes[idx].selectors.to.select(state.t);
        }
        if(state.o) {
          routes[idx].options.select(state.o);
        }
      });
      updateRoute();
    }
  }
  
  // update result
  let pendingUpdate = null;
  const updateResult = () => {
    if(!pendingUpdate) {
      pendingUpdate = setTimeout(_updateResult, 50); // delay it to catch consecutive call
    }
  };
  const _updateResult = () => {
    pendingUpdate = null;
    updateStates();
    
    const states = getStates();
    if(states.length > 0 && states[states.length-1].from && states[states.length-1].to) {
      addRoute();
    }
    
    // generate results
    const itineraries = states.map(state => {
      if(state.from && state.to) {
        return app.FARES.getItineraries(state.from, state.to, state.options);
      }
      return null;
    });
    
    let dayPassCost = app.CONF.dayPass.price;
    for(const disCode in app.DIS.discounts) {
      if(app.DIS.discounts.hasOwnProperty(disCode)) {
        const dis = app.DIS.discounts[disCode];
        if(app.DIS.hasPassDiscount(dis) && app.OPT.get(disCode)) {
          dayPassCost -= dis.getPassDiscount(dayPassCost);
        }
      }
    }
    let cost = {
      noPass: { min: 0, max: 0 },
      usePass: { min: dayPassCost, max: dayPassCost }
    };
    
    itineraries.forEach((itin, idx) => {
      itin = itin || [];
      itin.sort((a, b) => {
        if(a.usePass == b.usePass) {
          return a.transitForced?1:0 - b.transitForced?1:0;
        }
        return a.usePass?1:0 - b.usePass?1:0;
      })
      
      // find cost first
      const itinCost = {
        noPass: { min: Infinity, max: 0 },
        usePass: { min: Infinity, max: 0 }
      };
      
      let passLegCount = 0;
      let noPassLegCount = 0;
      itin.forEach(leg => {
        if(leg.usePass) {
          passLegCount++;
          leg.idx = passLegCount;
          itinCost.usePass.min = Math.min(itinCost.usePass.min, leg.fare);
          itinCost.usePass.max = Math.max(itinCost.usePass.max, leg.fare);
        } else {
          noPassLegCount++;
          leg.idx = noPassLegCount;
          itinCost.noPass.min = Math.min(itinCost.noPass.min, leg.fare);
          itinCost.noPass.max = Math.max(itinCost.noPass.max, leg.fare);
        }
      });
      
      if(passLegCount + noPassLegCount > 0) {
        
        // reset descriptions
        routes[idx].resultDivs.octopus.innerHTML = '';
        routes[idx].resultDivs.dayPass.innerHTML = '';
        routes[idx].resultDivs.subtotal.innerHTML = '';
        routes[idx].resultDivs.dayPass.appendChild(
          app.DOM.create('div', {className: 'buy-pass'}, [
            '* ',
            app.LANG.create('Day Pass', 'discount'),
            ' *'
          ])
        );
        routes[idx].resultDivs.octopus.style.display = 'flex';
        routes[idx].resultDivs.dayPass.style.display = 'flex';
        routes[idx].resultDivs.subtotal.style.display = 'flex';
        
        // cost consolidation
        cost.noPass.min += itinCost.noPass.min;
        cost.noPass.max += itinCost.noPass.max;
        
        // use no pass cost if day pass not applicable
        if(passLegCount === 0) {
          const descBox = app.DOM.create('div', { className: 'option' }, [
            app.DOM.create('span', { className: 'header' }, [
              app.LANG.create('Day pass not applicable', 'planner')
            ])
          ]);    
          routes[idx].resultDivs.dayPass.appendChild(descBox);
          cost.usePass.min += itinCost.noPass.min;
          cost.usePass.max += itinCost.noPass.max;
        } else {
          cost.usePass.min += itinCost.usePass.min;
          cost.usePass.max += itinCost.usePass.max;        
        }
        cost.usePass.min = parseFloat(cost.usePass.min.toFixed(3));
        cost.usePass.max = parseFloat(cost.usePass.max.toFixed(3));
        cost.noPass.min = parseFloat(cost.noPass.min.toFixed(3));
        cost.noPass.max = parseFloat(cost.noPass.max.toFixed(3));
        
        // fill in descriptions
        itin.forEach(leg => {
          const descBox = app.DOM.create('div', { className: 'option' });
          
          if(!leg.usePass) {
            routes[idx].resultDivs.octopus.appendChild(descBox);
            if(leg.fare === itinCost.noPass.min) {
              descBox.classList.add('best');
            }
          } else {
            routes[idx].resultDivs.dayPass.appendChild(descBox);
            if(leg.fare === itinCost.usePass.min) {
              descBox.classList.add('best');
            }
          }
          
          const header = app.DOM.create('div', {}, [
            app.DOM.create('span', { className: 'header'} , [
              app.LANG.create('Option', 'planner'),
              ' '+ leg.idx + ': $' + leg.fare.toFixed(1)
            ])
          ]);
          
          descBox.appendChild(header);
          descBox.appendChild(app.DOM.create('div', { className: 'route-legs'}, 
            app.TripWidget.create(leg.itin)
          ));
        });
        
        // subtotal
        routes[idx].resultDivs.subtotal.appendChild(
          app.DOM.create('div', { className: cost.usePass.max < cost.noPass.min?'preferred':'' }, [
            app.LANG.create('Using day pass'),
            ': ',
            cost.usePass.min==cost.usePass.max?cost.usePass.min.toFixed(1):(cost.usePass.min.toFixed(1)+' - '+cost.usePass.max.toFixed(1))
          ])
        );
        routes[idx].resultDivs.subtotal.appendChild(
          app.DOM.create('div', { className: cost.noPass.max < cost.usePass.min?'preferred':'' }, [
            app.LANG.create('Without day pass'),
            ': ',
            cost.noPass.min==cost.noPass.max?cost.noPass.min.toFixed(1):(cost.noPass.min.toFixed(1)+' - '+cost.noPass.max.toFixed(1))
          ])
        );
      }             
    });

  };
  
  // update states in STATE
  const updateStates = () => {
    const states = getStates();

    // build a compact state for STATE
    const compactStates = [];
    states.forEach(state => {
      const compactState = {}
      if(state.from !== null) {
        compactState['f'] = state.from;
      }
      if(state.to !== null) {
        compactState['t'] = state.to;
      }
      const o = {};
      for(const ov in state.options) {
        if(state.options.hasOwnProperty(ov)) {
          if(state.options[ov]) {
            o[ov] = state.options[ov];
          }
        }
      }
      if(Object.keys(o).length > 0) {
        compactState['o'] = o;
      }
      compactStates.push(compactState);
    });
    app.STATE.set('so', 'r', compactStates);
  };

  // get current state in a combat mode for
  const getStates = () => {
    const states = [];
    routes.forEach(route => {
      states.push({
        from: route.selectors.from.getValue(),
        to: route.selectors.to.getValue(),
        options: route.options.getValues()
      });
    });
    return states;
  };
  app.VIEW.sections['planner'] = {
      init: init,
      update: update
  };
  
}(window.MTRDP));
