// Section: give overview of a selected station
(function(app) {
  
  var earlyBirdOptions = ['nil', 'fwd', 'bak', 'rnd'];
  var earlyBirdInput = null;

  var resultDiv = null;
  
  var selectorContainer = null;
  var selector = null;
  var currStation = null; 
   
  var listeners = [];
  
  // initialize view
  // async
  function init(element) {
    return Promise.all([
      app.load('lib/views/components/station-selector/station-selector.js'),
      app.load('lib/views/round-trip/round-trip.css'),
      app.load('lib/fare-calculator.js'),
    ]).then(function() { _init(element); });
  }
  // initialization after loading resources
  function _init(element) {
    // generate HTML
    generateElements(element);
    
    // initialize station selector
    initSelector();
    
    // register listener to global options
    app.options.addListener(update);
  }
  
  // create and insert necessary elements to container
  function generateElements(element) {
    var earlyBirdForm;
    
    // generate view
    element.appendChild(
      app._$.create('div', { id: 'round-trip-overview-control' }, [
        selectorContainer=app._$.create('div'),
        app._$.create('div', { className: 'more-option'}, [
          earlyBirdForm=app._$.create('form', null, [
            app._$.create('label', { 'data-string': 'early-bird' })
          ])
        ])
      ])
    );
    
    // add early bird options
    earlyBirdOptions.forEach(function(option) {
      var input;
      var optID = 'overview-early-'+option;
      earlyBirdForm.appendChild(
        app._$.create('span', null, [
          input=app._$.create('input', { id: optID, type: 'radio', name: 'early', value: option }),
          app._$.create('label', { for: optID, 'data-string': option+'-trip' })
        ])
      )
      input.addEventListener('click', update);
    });
    earlyBirdInput = earlyBirdForm.elements['early'];
    earlyBirdInput.value = earlyBirdOptions[0];
    
    // load previous settings if available
    var savedValue = app.autosave.load('overview.early');
    if(savedValue !== null && earlyBirdOptions.indexOf(savedValue) >= 0) {
      earlyBirdInput.value = savedValue;            
    }
    
    // add result div
    element.appendChild(resultDiv=app._$.create('div', { id: 'round-trip-overview-result' }));    
  }

  // initialize selector
  function initSelector() {
    selector = new app.StationSelector();
    selector.attach(selectorContainer, setStation);
    
    // load previously saved station
    var savedStation = app.autosave.load('overview.station');
    if(savedStation !== null) {
      selector.select(savedStation);            
    }
    update();
  }
  
  // handle change of station
  function setStation(stationID) {
    currStation = stationID;
    update();
  }
  
  // update view, regenerate overview
  function update() {
    var lines = app.lines;
    
    // save options
    app.autosave.save('overview.early', earlyBirdInput.value);
    app.autosave.save('overview.station', currStation);
    
    var options = app.options.getAll();
    options.earlyBird = earlyBirdInput.value;
    
    if(currStation) {
      var overview = app.fareCalculator.getOverview(currStation, options);

      // generate result
      resultDiv.innerHTML = '';
      app.config.supportedLines.forEach(function(lineCode) {
          var stations = lines[lineCode]
          
          var lineDiv;
          resultDiv.appendChild(app._$.create('div', { className: 'line', 'data-line': lineCode }));
          resultDiv.appendChild(lineDiv = app._$.create('div', { className: 'stations' }));
          
          // stations in line
          stations.forEach(function(stationID) {
            lineDiv.appendChild(genStationDiv(stationID, overview[stationID]));
          });
      });
    }
    
    // notify all
    notifyAll();
  }
  
  // notify all
  function notifyAll() {
    listeners.forEach(function(listener) {
      listener();
    });
  }
  
  // generate div for station 
  function genStationDiv(stationID, trip) {
    
    var div = app._$.create('div', { className: 'station' }, [
      app._$.create('div', { className: 'station-name', 'data-station': stationID })
    ]);
    
    if(trip) {
      // octopus
      var octopusFare = trip.octopus.fwd.fare + trip.octopus.bak.fare;
      div.appendChild(app._$.create('div', { className:'trip-desc' }, [
        app._$.create('span', { 'data-string': 'octopus' }),
        app._$.create('span', null, ['$'+octopusFare.toFixed(1)])
      ]));
      
      div.appendChild(app._$.create('div', { className:'trip-desc' }, [
        app._$.create('span', { 'data-string': 'fwd-trip' }),':'
      ].concat(
        trip.octopus.fwd.render()
      )));
      
      div.appendChild(app._$.create('div', { className:'trip-desc' }, [
        app._$.create('span', { 'data-string': 'bak-trip' }),':'
      ].concat(
        trip.octopus.bak.render()
      )));
      
      // day pass 
      if(trip.dayPass && trip.dayPass.fwd && trip.dayPass.bak) {
        var dayPassFare = trip.dayPass.fwd.fare + trip.dayPass.bak.fare;
        if(app.options.get('daypass-10for1')) {
          dayPassFare += app.config.dayPass['10for1Price'];
        } else {
          dayPassFare += app.config.dayPass.price;
        }
        div.appendChild(app._$.create('div', { className:'trip-desc' }, [
          app._$.create('span', { 'data-string': 'daypass' }),
          app._$.create('span', null, ['$'+dayPassFare.toFixed(1)])
        ]));
        
        div.appendChild(app._$.create('div', { className:'trip-desc' }, [
          app._$.create('span', { 'data-string': 'fwd-trip' }),':'
        ].concat(
          trip.dayPass.fwd.render()
        )));
        
        div.appendChild(app._$.create('div', { className:'trip-desc' }, [
          app._$.create('span', { 'data-string': 'bak-trip' }),':'
        ].concat(
          trip.dayPass.bak.render()
        )));

        // change class if day pass is better
        if(dayPassFare < octopusFare) {
          div.className = 'station daypass';
        }
      }
    }
    return div;
  }
  
  // add listener that reacts to language changes
  function addListener(listener) {
    listeners.push(listener);
  }
  // remove listener
  function removeListener(listener) {
    var l = listeners.indexOf(listener);
    if(l >= 0) {
      listeners.splice(l, 1);
    }
  }
  
  app.sections['round-trip'] = {
    init: init,
    addListener: addListener
  };

})(window.MTRDP);