// station selector tool
(function(app) {
    
  const optionSize = { w: 5.5, h: 3 };
  const selectorSize = 6;
  const subEmSize = 0.6;
  
  // for estimation: subselector.width * subselector.fontSize / selector width
  const selectorWidthRatio = optionSize.w * subEmSize / selectorSize;
  const selectorHeightRatio = optionSize.h * subEmSize / selectorSize;
  
  let selectors = [];
  
  // (pre-)initialize view
  const init = async () => {
    await app.loadAll([
      'views/components/station-selector/station-selector.css',
      'CONF',
      'DOM',
    ]);
  };
  
  // static function : reset all selectors
  const resetAll = () => {
    if(selectors) {
      selectors.forEach(function(selector) {
        if(selector) {
          selector.reset();
        }
      })
    }
  };
  
  // station selector class (constructor)
  // label: label used when no value selected
  function StationSelector(label) {
    this.elem = app.DOM.create('div', { className: 'station-selector' }, [
      this.textElem=app.DOM.create('div', { }, [
        app.LANG.create(label?label:'Select station', 'mtr')
      ])
    ]);
        
    this.listeners = [];
    this.provider = null;
    this.value = null;
    
    selectors.push(this);
  };
  
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
    const lines = app.CONF.lines;
    const maxCol = Math.round(window.innerWidth / (this.elem.offsetWidth * selectorWidthRatio) / 2);
    const cols = Math.min(maxCol, Math.ceil(Math.sqrt(optionSize.w * optionSize.h * lines.length)/optionSize.w));
    const rows = Math.ceil(lines.length / cols) + (presetValue?1:0); // add one row if pre-set value exists
    
    // generate line selector
    //   and position grid
    this.elem.appendChild(this.linesElem=app.DOM.create('div', {
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
      const stationOption = app.DOM.create('div', { className: 'station' }, [
        app.LANG.create(presetValue, 'mtr')
      ]);
      stationOption.addEventListener('click', this.selectStation.bind(this, presetValue));
      this.linesElem.appendChild(stationOption);
      this.linesElem.appendChild(app.DOM.create('div', { className: 'break' }));      
    }
    
    for(const lineCode of lines) {
      const lineOption = app.DOM.create('div', { className: 'line' }, [
        app.LANG.create(lineCode, 'mtr')
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
    const stations = app.LINES.getLine(lineCode);
    const maxCol = Math.round(window.innerWidth / (this.elem.offsetWidth * selectorWidthRatio) / 2);
    const cols = Math.min(maxCol, Math.ceil(Math.sqrt(optionSize.w * optionSize.h * (2+stations.length))/optionSize.w));
    const rows = Math.ceil((2+stations.length) / cols);
    
    // generate station selector
    //   and position grid
    this.elem.appendChild(this.stationsElem=app.DOM.create('div', {
      style: {
        width: cols * optionSize.w  +'em',
        height: rows * optionSize.h +'em',
        marginLeft: -cols * optionSize.w/2 +'em',
        marginTop: -Math.min(1/selectorHeightRatio+3, rows) * optionSize.h/2 +'em',
      },
      className: 'subselector'
    }));
    
    // add line name
    const lineOption = app.DOM.create('div', { className: 'line' }, [
      app.LANG.create(lineCode, 'mtr')
    ]);
    lineOption.addEventListener('click', this.listLines.bind(this));
    this.stationsElem.appendChild(lineOption);

    // add stations
    for(const stationID of stations) {
      const stationOption = app.DOM.create('div', { className: 'station' }, [
        app.LANG.create(stationID, 'mtr')
      ]);
      stationOption.addEventListener('click', this.selectStation.bind(this, stationID));
      this.stationsElem.appendChild(stationOption);
    }

    // add return button
    const returnOption = app.DOM.create('div', { className: 'line' }[
      app.DOM.matIcon('undo')
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
    app.LANG.update(this.textElem, stationID, 'mtr');
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
  StationSelector.init = init;
  app.StationSelector = StationSelector;
  
})(window.MTRDP);
