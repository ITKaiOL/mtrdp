// Summary view 
// app.VIEW must be loaded first
(function(app) {
  
  let stationSelector = null;
  const discountSelectors = { in: null, out: null };
  const currOptions = {};
  let descDivs = null;
  
  // (pre-)initialize view
  const init = async () => {
    await app.loadAll([
      'views/overview/overview.css', 
      'StationSelector',
      'DiscountSelector',
      'DOM',
      'LANG',
      'STATE', // for section options, managed by section
      'OPT',   // for global options
      'LINES',
      'FARES',
      'MAPSLINK',
      'TripWidget',
    ]);
    
    // main controls
    const contentDiv = app.DOM.get('content');
    contentDiv.setAttribute('data-section', 'overview');
    const selectorDiv = app.DOM.create('div', { className: 'main-selector'});
    const discountDivs = {
      in: app.DOM.create('div'),
      out: app.DOM.create('div')
    };
    contentDiv.appendChild(
      app.DOM.create('div', { className: 'selector-controls'}, [
        selectorDiv,
        app.DOM.create('div', { className: 'main-discount'}, [
          app.DOM.create('div', { className: 'discount-option-group' }, [
            app.LANG.create('Outbound', 'discount'),
            ': ',
            discountDivs.out
          ]),
          app.DOM.create('div', { className: 'discount-option-group' }, [
            app.LANG.create('Inbound', 'discount'),
            ': ',
            discountDivs.in
          ]),
        ])
      ])
    );

    // reset description boxes
    descDivs = null;
    
    // add station selector
    currOptions.station = app.STATE.get('so', 's');
    stationSelector = new app.StationSelector();
    if(app.LINES.hasStation(currOptions.station)) {
      stationSelector.select(currOptions.station);
    } else {
      currOptions.station = null;
    }
    
    stationSelector.attach(selectorDiv, (stationID)=>{
      app.STATE.set('so', 's', stationID);
      currOptions.station = stationID;
      genSummary();
    });
    
    // add outbound options
    currOptions.outbound = app.STATE.get('so', 'o');
    discountSelectors.out = new app.DiscountSelector(currOptions.outbound);
    discountSelectors.out.attach(discountDivs.out, (values)=>{
      app.STATE.set('so', 'o', values, {trueProp: true});
      currOptions.outbound = values;
      genSummary();
    });
    
    // add inbound options
    currOptions.inbound = app.STATE.get('so', 'i');
    discountSelectors.in = new app.DiscountSelector(currOptions.inbound);
    discountSelectors.in.attach(discountDivs.in, (values)=>{
      app.STATE.set('so', 'i', values, {trueProp: true});
      currOptions.inbound = values;
      genSummary();
    });
        
    // generate summary if possible
    genSummary();
  };
  
  let pendingUpdate = null;
  const genSummary = () => {
    if(!pendingUpdate) {
      pendingUpdate = setTimeout(_genSummary, 50); // delay it to catch consecutive call
    }
  };
  const _genSummary = () => {
    pendingUpdate = null;
    if(currOptions.station) {
      const stations = app.LINES.getStations();
      const itineraries = stations.map(stationID => {
        return {
          station: stationID,
          out: app.FARES.getItineraries(currOptions.station, stationID, currOptions.outbound),
          in: app.FARES.getItineraries(stationID, currOptions.station, currOptions.inbound)
        };
      });
      
      if(descDivs === null) {
        genResultDiv();
      }
      
      let passCost = app.CONF.dayPass.price;
      for(const disCode in app.DIS.discounts) {
        if(app.DIS.discounts.hasOwnProperty(disCode)) {
          const dis = app.DIS.discounts[disCode];
          if(app.DIS.hasPassDiscount(dis) && app.OPT.get(disCode)) {
            passCost -= dis.getPassDiscount(passCost);
          }
        }
      }
      
      itineraries.forEach((itin) => {
        // buld options and find best dist without pass
        const candidateOptions = [];
        let bestDistNoPassRoute = null;
        let bestDistUsePassRoute = null;
        itin.out.forEach(outleg => {
          itin.in.forEach(inleg => {
            if(inleg.usePass === outleg.usePass) {
              route = { out: outleg, in: inleg, 
                        cost: inleg.fare + outleg.fare, 
                        usePass: inleg.usePass, best: false,
                        dist: inleg.dist + outleg.dist };
              if(!route.usePass && 
                  (bestDistNoPassRoute === null || 
                   route.dist < bestDistNoPassRoute.dist || 
                   (route.dist === bestDistNoPassRoute.dist && route.cost > bestDistNoPassRoute.cost))) {
                bestDistNoPassRoute = route;
              } else if(route.usePass && 
                  (bestDistUsePassRoute === null || 
                   route.dist < bestDistUsePassRoute.dist || 
                   (route.dist === bestDistUsePassRoute.dist && route.cost > bestDistUsePassRoute.cost))) {
                bestDistUsePassRoute = route;
              }
              candidateOptions.push(route);
            }
          });
        });
        
        // sort option by dist
        candidateOptions.sort((a, b) => (a.dist !== b.dist ? a.dist - b.dist : a.cost - b.cost));

        // keep only options that are:
        //   1. best dist without pass
        //   2. route that use pass and 
        //      at most the cost of #1 not including pass cost
        //   3. route that do not use pass with cost 
        //      at most the cost of best dist in #2 
        //      but including pass cost 
        let currentBestNoPassCost = bestDistNoPassRoute.cost;
        let currentBestUsePassCost = bestDistNoPassRoute.cost;
        const options = candidateOptions.filter(option => {
          if(option === bestDistNoPassRoute) {
            return true;
          }
          if(option.usePass && option.cost <= bestDistNoPassRoute.cost) {
            return true;
          } 
          if(!option.usePass && option.cost <= currentBestNoPassCost 
                    && (bestDistUsePassRoute === null || option.cost <= bestDistUsePassRoute.cost + passCost)) {
            currentBestNoPassCost = option.cost;
            return true;
          }
          return false;
        });
        
        // add pass cost
        options.forEach(option => {
          if(option.usePass) {
            option.cost += passCost;
          }
        });
        
        // sort option by dist/pass uses/cost
        options.sort((a, b) => {
          if(a.dist !== b.dist) {
            return a.dist - b.dist;
          }
          if(a.usePass !== b.usePass) {
            return a.usePass ? 1: -1
          }
          return a.cost - b.cost;
        });
        
        // determine best cost
        const costs = {
          noPass: { min: Infinity, max: 0, count: 0 },
          usePass: { min: Infinity, max: 0, count: 0 }
        };
        let minCost = Infinity;
        let minCostNoPass = false;
        options.forEach(option => {
          if(option.usePass) {
            costs.usePass.min = Math.min(costs.usePass.min, option.cost);
            costs.usePass.max = Math.max(costs.usePass.max, option.cost);
            costs.usePass.count++;
          } else {
            costs.noPass.min = Math.min(costs.noPass.min, option.cost);
            costs.noPass.max = Math.max(costs.noPass.max, option.cost);
            costs.noPass.count++;
          }
          if(option.cost < minCost) {
            minCost = option.cost;
            minCostNoPass = !option.usePass;
          } else if(option.cost === minCost && !option.usePass) {
            minCostNoPass = true;
          }
        });
        
        descDivs[itin.station].forEach(descDiv => {
          descDiv.innerHTML = '';
          descDiv.parentNode.classList.remove('daypass-maybe');
          descDiv.parentNode.classList.remove('daypass');
          
          // only if not the current station
          if(itin.station !== currOptions.station) {
            
            if(costs.usePass.count > 0 && costs.usePass.max < costs.noPass.min) {
              descDiv.parentNode.classList.add('daypass');            
            } else if(costs.usePass.count > 0 && costs.usePass.min  < costs.noPass.max) {
              descDiv.parentNode.classList.add('daypass-maybe');  
            }

            options.forEach((choice, idx) => {
              if(choice.cost === minCost && minCostNoPass !== choice.usePass) {
                choice.best = true;
              }
              genOptionDesc(descDiv, idx+1, choice);
            });
            
            // add directions links
            const links = {
              out: app.MAPSLINK.get(
                app.LINES.getInfo(currOptions.station)['nameEN'], 
                app.LINES.getInfo(itin.station)['nameEN']
              ),
              in: app.MAPSLINK.get(
                app.LINES.getInfo(itin.station)['nameEN'], 
                app.LINES.getInfo(currOptions.station)['nameEN']
              )
            };
            const tripElements = app.TripWidget.create([
              { from: currOptions.station, to: itin.station, link: links.out },
              { from: itin.station, to: currOptions.station, link: links.in }
            ]);
            descDiv.appendChild(app.DOM.create('div', { className: 'directions' }, [
              app.DOM.create('div', { className: 'dir-header' }, [
                app.DOM.matIcon('directions'),
                app.LANG.create('Directions via Google Maps', 'overview')
              ]),
              app.DOM.create('div', { className: 'dir-body' }, tripElements),
            ]));
          }

        });
      });
      
    }
  };
  
  // generate description of one option
  const genOptionDesc = (descDiv, idx, option) => {
    const descBox = app.DOM.create('div', { className: 'option' });
    descDiv.appendChild(descBox);
    if(option.best) {
      descBox.classList.add('best');
    }
    
    const header = app.DOM.create('div', {}, [
      app.DOM.create('span', { className: 'header'} , [
        app.LANG.create('Option', 'overview'),
        ' '+ idx + ': $' + option.cost.toFixed(1)
      ])
    ]);
    
    descBox.appendChild(header);
    
    if(option.usePass) {
      descBox.appendChild(app.DOM.create('div', {className: 'buy-pass'}, [
        '* ',
        app.LANG.create('Day Pass', 'discount'),
        ' *'
      ]));
    }
    
    descBox.appendChild(app.DOM.create('div', {}, [
      app.LANG.create('Outbound', 'discount'),
      ': '].concat(app.TripWidget.create(option.out.itin))
    ));
    descBox.appendChild(app.DOM.create('div', {}, [
      app.LANG.create('Inbound', 'discount'),
      ': '].concat(app.TripWidget.create(option.in.itin))
    ));
  };
  
  // generate result divs
  const genResultDiv = () => {
    descDivs = {};
    const contentDiv = app.DOM.get('content');
    const resultDiv = app.DOM.create('div', { className: 'result' });
    contentDiv.appendChild(resultDiv);
    
    // generate lines
    app.CONF.lines.forEach(line => {
      const stationsDiv = app.DOM.create('div', { className: 'stations' });
      resultDiv.appendChild(
        app.DOM.create('div', { className: 'line-stations' }, [
          app.DOM.create('div', { className: 'line' }, [
            app.LANG.create(line, 'mtr'),
          ]),
          stationsDiv
      ]));
      
      // generate stations
      app.LINES.getLine(line).forEach(station => {
        const descDiv = app.DOM.create('div', { className: 'station-desc' });
        if(!descDivs.hasOwnProperty(station)) {
          descDivs[station] = [];
        }
        descDivs[station].push(descDiv);
        stationsDiv.appendChild(app.DOM.create('div', { className: 'station', 'data-station': station }, [
          app.DOM.create('div', { className: 'station-name' }, [
            app.LANG.create(station, 'mtr') ]),
          descDiv
        ]));
      });
    });
  };
    
  // update view from current options
  const update = () => {
    currOptions.station = app.STATE.get('so', 's');
    stationSelector.select(currOptions.station);
    currOptions.outbound = app.STATE.get('so', 'o');
    discountSelectors.out.select(currOptions.outbound);
    currOptions.inbound = app.STATE.get('so', 'i');
    discountSelectors.in.select(currOptions.inbound);
  };
  
  // unload view
  const unload = () => {
    if(stationSelector !== null) {
      stationSelector.free();
    }
    if(discountSelector.in !== null) {
      discountSelector.in.free();
    }
    if(discountSelector.out !== null) {
      discountSelector.out.free();
    }
  }
  
  app.VIEW.sections['overview'] = {
      init: init,
      update: update,
      unload: unload,
  };
  
}(window.MTRDP));
