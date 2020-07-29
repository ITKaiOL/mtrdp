(function(app) {
    
  const optionSize = { w: 5.5, h: 3 };
  const selectorSize = 6;
  const subEmSize = 0.6;
  
  // for estimation: subselector.width * subselector.fontSize / selector width
  const selectorWidthRatio = optionSize.w * subEmSize / selectorSize;
  const selectorHeightRatio = optionSize.h * subEmSize / selectorSize;
  
  let selectors = null;
  // static function : reset all selectors
  function resetAll() {
    if(selectors) {
      selectors.forEach(function(selector) {
        if(selector) {
          selector.reset();
        }
      })
    }
  }
  
  // station selector class
  // label: label used when no value selected
  function StationSelector(label) {
    this.elem = app._$.create('div', { className: 'station-selector' }, [
      this.textElem=app._$.create('div', { 'data-string':label?label:'select-station' })
    ]);
        
    this.listeners = [];
    this.provider = null;
    this.value = null;
    
    // load CSS the first time used
    if(selectors === null) {
      document.body.addEventListener('click', resetAll);
      app.load('lib/views/components/station-selector/station-selector.css').then();
      selectors = [];
    }
    
    selectors.push(this);
  }
  
  // attach selector to a container and the corresponding listener
  // container: container of the selector
  // listener: called when a station is selected
  StationSelector.prototype.attach = function(container, listener) {   
    container.appendChild(this.elem);
    
    // enable trigger
    this.elem.addEventListener('click', this.listLines.bind(this));
    
    this.addListener(listener);
  };
  
  // add listener for the event of station being selected
  StationSelector.prototype.addListener = function(listener) {
    this.listeners.push(listener);
  }
  
  // set a provider (a selector) of a pre-set initial values
  StationSelector.prototype.setProvider = function(provider) {
    this.provider = provider;
  }
  
  // activate selector
  StationSelector.prototype.listLines = function(event) {
    // stop click
    event.stopPropagation();
    event.preventDefault();

    // reset all selectors
    resetAll();
        
    // chcek if there exists a provider with a value 
    let presetValue = null;
    if(this.provider) {
      presetValue = this.provider.getValue();
    }
    
    // calculate grid size
    const lines = app.config.supportedLines;
    const maxCol = Math.round(window.innerWidth / (this.elem.offsetWidth * selectorWidthRatio) / 2);
    const cols = Math.min(maxCol, Math.ceil(Math.sqrt(optionSize.w * optionSize.h * lines.length)/optionSize.w));
    const rows = Math.ceil(lines.length / cols) + (presetValue?1:0); // add one row if pre-set value exists
    
    // generate line selector
    //   and position grid
    this.elem.appendChild(this.linesElem=app._$.create('div', {
      style: {
        width: cols * optionSize.w  +'em',
        height: rows * optionSize.h +'em',
        marginLeft: -cols * optionSize.w/2 +'em',
        marginTop: -Math.min(1/selectorHeightRatio+3, rows) * optionSize.h/2 +'em',
      },
      className: 'subselector'
    }));
    
    // add extra row if pre-set value exists
    if(presetValue) {
      const stationOption = app._$.create('div', { className: 'station' }, [
        app.__.s(presetValue)
      ]);
      stationOption.addEventListener('click', this.selectStation.bind(this, presetValue));
      this.linesElem.appendChild(stationOption);
      this.linesElem.appendChild(app._$.create('div', { className: 'break' }));      
    }
    
    for(let l = 0; l < lines.length; ++l) {
      const lineCode = lines[l];
      const lineOption = app._$.create('div', { className: 'line' }, [
        app.__.l(lineCode)
      ]);
      lineOption.addEventListener('click', this.listStation.bind(this, lineCode));
      this.linesElem.appendChild(lineOption);
    }
    
  };
  
  StationSelector.prototype.listStation = function(lineCode, event) {
    
    // stop click
    event.stopPropagation();
    event.preventDefault();

    // reset all selectors
    resetAll();

    // calculate grid size
    const stations = app.lines[lineCode];
    const maxCol = Math.round(window.innerWidth / (this.elem.offsetWidth * selectorWidthRatio) / 2);
    const cols = Math.min(maxCol, Math.ceil(Math.sqrt(optionSize.w * optionSize.h * (2+stations.length))/optionSize.w));
    const rows = Math.ceil((2+stations.length) / cols);
    
    // generate station selector
    //   and position grid
    this.elem.appendChild(this.stationsElem=app._$.create('div', {
      style: {
        width: cols * optionSize.w  +'em',
        height: rows * optionSize.h +'em',
        marginLeft: -cols * optionSize.w/2 +'em',
        marginTop: -Math.min(1/selectorHeightRatio+3, rows) * optionSize.h/2 +'em',
      },
      className: 'subselector'
    }));
    
    // add line name
    const lineOption = app._$.create('div', { className: 'line' }, [
      app.__.l(lineCode)
    ]);
    lineOption.addEventListener('click', this.listLines.bind(this));
    this.stationsElem.appendChild(lineOption);

    // add stations
    for(let s = 0; s < stations.length; ++s) {
      const stationID = stations[s];
      const stationOption = app._$.create('div', { className: 'station' }, [
        app.__.s(stationID)
      ]);
      stationOption.addEventListener('click', this.selectStation.bind(this, stationID));
      this.stationsElem.appendChild(stationOption);
    }

    // add return button
    const returnOption = app._$.create('div', { className: 'line' }[
      app._$.matIcon('undo')
    ]);
    returnOption.addEventListener('click', this.listLines.bind(this));
    this.stationsElem.appendChild(returnOption);
  };
  
  // deactivate selector
  StationSelector.prototype.reset = function() {
    // remove line selector
    if(this.linesElem) {
      this.elem.removeChild(this.linesElem);
      this.linesElem = null;
    }
    // remove station selector
    if(this.stationsElem) {
      this.elem.removeChild(this.stationsElem);
      this.stationsElem = null;
    }
  };
  
  // selected a station, trigger clean up and listener
  StationSelector.prototype.selectStation = function(stationID, event) {
    this.select(stationID);    
    event.stopPropagation();
    event.preventDefault();
  };
  
  // manually select a station
  StationSelector.prototype.select = function(stationID) {
    this.value = stationID;
    this.textElem.removeAttribute('data-string');
    this.textElem.setAttribute('data-station', stationID);
    this.reset();
    this.notifyAll();
  };

  // notify all listener with the current value
  StationSelector.prototype.notifyAll = function() {
    const value = this.value;
    this.listeners.forEach(function(listener) {
      listener(value); 
    });
  };
  
  // manually retrieve the current value
  StationSelector.prototype.getValue = function() {
    return this.value;
  };
  
  // free up resources by removing it from selector list
  StationSelector.prototype.free = function() {
    const index = selectors.indexOf(this);
    if(index >= 0) {
      selectors.splice(index, 1);
    }
  };
  
  // inject to app
  app.StationSelector = StationSelector;
  
})(window.MTRDP);
