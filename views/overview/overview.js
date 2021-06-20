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
        // group outbound/inbound into options
        const options = {
          direct: { out: null, in: null, cost: 0, usePass: false, best: false, direct: true },
          transit: { out: null, in: null, cost: 0, usePass: false, best: false, direct: false },
          dayPass: { out: null, in: null, cost: passCost, usePass: true, best: false, direct: false },
          dayPassTransit: { out: null, in: null, cost: passCost, usePass: true, best: false, direct: false }
        };
        ['in', 'out'].forEach(dir => {
          itin[dir].forEach(leg => {
            if(leg.usePass && leg.transitForced) {
              options.dayPassTransit[dir] = leg;
              options.dayPassTransit.cost += leg.fare;
            }
            if(leg.usePass && !leg.transitForced) {
              options.dayPass[dir] = leg;
              options.dayPass.cost += leg.fare;
            }
            if(!leg.usePass && leg.transitForced) {
              options.transit[dir] = leg;
              options.transit.cost += leg.fare;
            }
            if(!leg.usePass && !leg.transitForced) {
              options.direct[dir] = leg;
              options.direct.cost += leg.fare;
            }
          });
        });
        
        descDivs[itin.station].forEach(descDiv => {
          descDiv.innerHTML = '';
          descDiv.parentNode.classList.remove('daypass-transit');
          descDiv.parentNode.classList.remove('daypass');
          
          // only if not the current station
          if(itin.station !== currOptions.station) {
            let minNormalCost = options.direct.cost;
            
            const choices = [];
            // normal
            choices.push(options.direct);
            
            // transit
            if(options.transit.out !== null || options.transit.in !== null) {
              if(options.transit.out === null) {
                options.transit.out = options.direct.out;
                options.transit.cost += options.transit.out.fare;
              }
              if(options.transit.in === null) {
                options.transit.in = options.direct.in;
                options.transit.cost += options.transit.in.fare;
              }
              choices.push(options.transit);
              if(options.transit.cost < minNormalCost) {
                minNormalCost = options.transit.cost;
              }
            }
            
            // day pass
            if(options.dayPass.out !== null && options.dayPass.in !== null) {
              choices.push(options.dayPass);
              
              // +transit
              if(options.dayPassTransit.out !== null || options.dayPassTransit.in !== null) {
                if(options.dayPassTransit.out === null) {
                  options.dayPassTransit.out = options.dayPass.out;
                  options.dayPassTransit.cost += options.dayPassTransit.out.fare;
                }
                if(options.dayPassTransit.in === null) {
                  options.dayPassTransit.in = options.dayPass.in;
                  options.dayPassTransit.cost += options.dayPassTransit.in.fare;
                }
                choices.push(options.dayPassTransit);
                
                // determine class if this is somehow a better choice
                if (options.dayPassTransit.cost < minNormalCost) {
                  descDiv.parentNode.classList.add('daypass-transit');
                }
              }
              
              // determine real class
              if(options.dayPass.cost < minNormalCost && options.dayPass.cost < options.direct.cost) {
                descDiv.parentNode.classList.remove('daypass-transit');
                descDiv.parentNode.classList.add('daypass');
              } else if (options.dayPass.cost < options.direct.cost) {
                descDiv.parentNode.classList.add('daypass-transit');
              }
            }
            
            // find min cost
            let minCost = Infinity;
            let minCostWithPass = null;
            choices.forEach((choice, idx) => {
              if(choice.cost < minCost) {
                minCost = choice.cost;
                minCostWithPass = choice.usePass;
              } else if(choice.cost === minCost) {
                // fix to false if possible
                minCostWithPass = minCostWithPass && choice.usePass;
              }
            });
            
            choices.forEach((choice, idx) => {
              if(choice.cost === minCost && minCostWithPass === choice.usePass) {
                choice.best = true;
              }
              genOptionDesc(descDiv, idx+1, choice);
            });
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
