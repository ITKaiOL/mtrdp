(function(app) {
    
  var optionSize = { w: 5.5, h: 3 };
  var selectorSize = 6;
  var subEmSize = 0.6;
  
  // for estimation: subselector.width * subselector.fontSize / selector width
  var selectorWidthRatio = optionSize.w * subEmSize / selectorSize;
  var selectorHeightRatio = optionSize.h * subEmSize / selectorSize;
  
  var selectors = null;
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
    this.elem = document.createElement('div');
    this.elem.className = 'station-selector';
    
    this.textElem = document.createElement('div');
    this.textElem.setAttribute('data-string', label?label:'select-station');
    this.elem.appendChild(this.textElem);
    
    this.listeners = [];
    this.provider = null;
    this.value = null;
    
    // first time using
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
    
    // generate line selector
    var lines = app.config.supportedLines;
    this.linesElem = document.createElement('div');
    this.elem.appendChild(this.linesElem);
    
    // calculate grid size
    var maxCol = Math.round(window.innerWidth / (this.elem.offsetWidth * selectorWidthRatio) / 2);
    var cols = Math.min(maxCol, Math.ceil(Math.sqrt(optionSize.w * optionSize.h * lines.length)/optionSize.w));
    var rows = Math.ceil(lines.length / cols);
    
    // chcek if there exists a provider with a value 
    var presetValue = null;
    if(this.provider) {
      presetValue = this.provider.getValue();
    }
    // add one row if pre-set value exists
    if(presetValue) {
      rows++;
    }
    
    // position grid
    this.linesElem.style.width = cols * optionSize.w  +'em';
    this.linesElem.style.height = rows * optionSize.h +'em';
    this.linesElem.style.marginLeft = -cols * optionSize.w/2 +'em';
    this.linesElem.style.marginTop  = -Math.min(1/selectorHeightRatio+3, rows) * optionSize.h/2 +'em';
    this.linesElem.className = 'subselector';
    
    // add extra row if pre-set value exists
    if(presetValue) {
      var stationOption = document.createElement('div');
      stationOption.textContent = app.__.s(presetValue);
      stationOption.className = 'station';
      this.linesElem.appendChild(stationOption);
      stationOption.addEventListener('click', this.selectStation.bind(this, presetValue));
      var linebreak = document.createElement('div');
      linebreak.className = 'break';
      this.linesElem.appendChild(linebreak);
      
    }
    for(var l = 0; l < lines.length; ++l) {
      var lineCode = lines[l];
      var lineOption = document.createElement('div');
      lineOption.textContent = app.__.l(lineCode);
      lineOption.className = 'line';
      this.linesElem.appendChild(lineOption);
      
      lineOption.addEventListener('click', this.listStation.bind(this, lineCode));
    }
    
  };
  
  StationSelector.prototype.listStation = function(lineCode, event) {
    
    // stop click
    event.stopPropagation();
    event.preventDefault();

    // reset all selectors
    resetAll();

    // generate station selector
    var stations = app.lines[lineCode];
    this.stationsElem = document.createElement('div');
    this.elem.appendChild(this.stationsElem);

    // calculate grid size
    var maxCol = Math.round(window.innerWidth / (this.elem.offsetWidth * selectorWidthRatio) / 2);
    var cols = Math.min(maxCol, Math.ceil(Math.sqrt(optionSize.w * optionSize.h * (2+stations.length))/optionSize.w));
    var rows = Math.ceil((2+stations.length) / cols);
    // position grid
    this.stationsElem.style.width = cols * optionSize.w  +'em';
    this.stationsElem.style.height = rows * optionSize.h +'em';
    this.stationsElem.style.marginLeft = -cols * optionSize.w/2 +'em';
    this.stationsElem.style.marginTop  = -Math.min(1/selectorHeightRatio+3, rows) * optionSize.h/2 +'em';
    this.stationsElem.className = 'subselector';
    
    // add line name
    var lineOption = document.createElement('div');
    lineOption.textContent = app.__.l(lineCode);
    lineOption.className = 'line';
    this.stationsElem.appendChild(lineOption);
    lineOption.addEventListener('click', this.listLines.bind(this));

    // add stations
    for(var s = 0; s < stations.length; ++s) {
      var stationID = stations[s];
      var stationOption = document.createElement('div');
      stationOption.textContent = app.__.s(stationID);
      stationOption.className = 'station';
      this.stationsElem.appendChild(stationOption);
      stationOption.addEventListener('click', this.selectStation.bind(this, stationID));
    }

    // add return name
    var returnOption = document.createElement('div');
    returnOption.className = 'line';
    var matIcon = document.createElement('i');
    matIcon.className = 'material-icons';
    matIcon.textContent = 'undo';
    returnOption.appendChild(matIcon);
    this.stationsElem.appendChild(returnOption);
    returnOption.addEventListener('click', this.listLines.bind(this));

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
    var value = this.value;
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
    var index = selectors.indexOf(this);
    if(index >= 0) {
      selectors.splice(index, 1);
    }
  };
  
  // inject to app
  app.StationSelector = StationSelector;
  
})(window.MTRDP);
