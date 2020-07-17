// load and process data for the app
(function(app) {
  
  // for fare distance analysis
  var connections;
  
  // Simple AJAX CSV Loader in promise
  // async
  function readCSV(url) {
    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        // fix quoted values and trim spaces
        function trimQuotes(value) {
          value = value.trim();
          return (/^".*"$/.test(value))?value.slice(1,-1):value;
        }
        // split row into columns and trim their quotes
        function splitDataRow(row) {
          return row.split(',').map(trimQuotes);
        }
        if(xhr.readyState === XMLHttpRequest.DONE) {
          
          var csvLines = xhr.responseText.split("\n").map(splitDataRow);
          
          // extract header
          var headers = csvLines.shift();
          // merge header and date
          var data = csvLines.map(function(record) {
            return Object.fromEntries(headers.map(function(key, index) { return [key, record[index]]; }));
          });

          resolve(data);
        }
      };
      xhr.open('GET', url, true);
      xhr.send();
    });
  }
  
  // parse station CSV data
  // async
  function stationParser(data) {
    return Promise.all([
      extractStationNames(data),
      extractLinesStations(data),
      extractLineConnectedStations(data)
    ]);
  }
  
  // extract station names
  // async
  function extractStationNames(data) {
    return new Promise(function(resolve) {
      app.names.stations = [];
      var stationNames = app.names.stations;
      
      data.forEach(function(row) {
        var stationID = parseInt(row['Station ID']);
        if(stationNames.length > stationID || !stationNames[stationID]) {
          stationNames[stationID] = {
            zh: row['Chinese Name'], 
            en: row['English Name'] 
          };
        }
      });
      resolve();
    });
  }
  
  // extract stations in supported lines
  // async
  function extractLinesStations(data) {
    return new Promise(function(resolve) {
      var supportedLines = app.config.supportedLines;
      var lines = app.lines;
    
      for(var i = 0; i < data.length; ++i) {
        var lineCode = data[i]['Line Code'];
        var stationID = parseInt(data[i]['Station ID']);
        
        // only consider supported lines
        if(supportedLines.indexOf(lineCode) >= 0) {
          if(!lines.hasOwnProperty(lineCode)) {
            lines[lineCode] = [];
          }
          // add to line if station not in line
          if(lines[lineCode].indexOf(stationID) < 0) {
            lines[lineCode].push(stationID);
          }
        }
      }
      resolve();
    });
  }
  
  // extract connected stations from lines
  // async
  function extractLineConnectedStations(data) {
    return new Promise(function(resolve) {
      var supportedLines = app.config.supportedLines;
      var stationMap = {};
      var lastLineDir = null;
      var lastStationID = null;
      
      connections = [];
      for(var i = 0; i < data.length; ++i) {
        var lineCode = data[i]['Line Code'];
        var dir = data[i]['Direction'];
        var stationID = parseInt(data[i]['Station ID']);
        // consider supported lines only
        if(supportedLines.indexOf(lineCode) >= 0) {
          
          // prepare connection list for this station
          if(connections.length < stationID || !connections[stationID]) {
            connections[stationID] = [];
          }
          
          // add to connection if same line/direction as the previous
          var thisLineDir = lineCode+'-'+dir;
          if(thisLineDir === lastLineDir) {
            // set a temp value for processing later
            connections[lastStationID][stationID] = Infinity;
          } else {
            lastLineDir = thisLineDir;
          }
          
          lastStationID = stationID;
        }
      }
      resolve();
    });
  }
  
  // load stations from datafile
  // async
  function loadStations(datafile) {
    var url = new URL('./'+datafile, document.baseURI)
    return readCSV(url).then(stationParser);
  }
  
  // parse CSV data into fare map
  function fareParser(data) {
    return new Promise(function (resolve) {
      var fares = app.fares;

      for(var i = 0; i < data.length; ++i) {
        var srcID = parseInt(data[i]['SRC_STATION_ID']);
        var destID = parseInt(data[i]['DEST_STATION_ID']);
        var fare = parseFloat(data[i]['OCT_ADT_FARE']);
        
        if(fares.length <= srcID || !fares[srcID]) {
          fares[srcID] = [];
        }
        fares[srcID][destID] = fare;
        if(fare > 0 && fare < app.minFare) {
          app.minFare = fare;
        }
      }
      resolve();
    });
  }
  
  // load fares from datafile
  // async
  function loadFares(datafile) {
    var url = new URL('./'+datafile, document.baseURI);
    return readCSV(url).then(fareParser);
  }
  
  // calculate fare distances betweeen all stations
  // async
  function calculateFareDistances() {
    return new Promise(function(resolve) {
      var lines = app.lines;
      var fares = app.fares;
      var minFare = app.minFare;
      
      // add fares to connection
      for(var s1 = 0; s1 < connections.length; ++s1) {
        if(connections[s1]) {
          for(var s2 = 0; s2 < connections[s1].length; ++s2) {
            if(connections[s1][s2]) {
              connections[s1][s2] = fares[s1][s2];
            } 
          }
        } 
      }
      
      // detect interchanges
      for(var s1 = 0; s1 < fares.length; ++s1) {
        if(fares[s1]) {
          for(var s2 = 0; s2 < fares[s1].length; ++s2) {
            if(s1 !== s2 && fares[s1][s2] === 0) {
              // add half of minimum fare to distinguish two changing stations
              connections[s1][s2] = minFare/2; 
            } 
          }
        } 
      }
      
      // calculate fare distance of each stations
      for(var lineCode in lines) {
        if(lines.hasOwnProperty(lineCode)) {
          for(var s = 0; s < app.lines[lineCode].length; ++s) {
            var stationID = app.lines[lineCode][s];
            if(!app.fareDistances[stationID]) {
              calculateOneFareDistance(stationID);
            }
          }
        }
      }
      resolve();
    });
  }
  
  // calculate fare discance of one station
  function calculateOneFareDistance(stationID) {
    var connectionPQueue = [];
    // insert item to pqueue, maintaining order
    function insertPQueue(pQueue, item) {
      for(var i = 0; i < pQueue.length; ++i) {
        if(item.dist > pQueue[i].dist) {
          pQueue.splice(i, 0, item);
          return;
        }
      }
      // the smallest, put at end of list
      pQueue.push(item);
    }
    
    app.fareDistances[stationID] = [];
    connectionPQueue.push({
      id: stationID,
      dist: 0
    });
    
    while(connectionPQueue.length > 0) {
      var desc = connectionPQueue.pop();
      var fareDistances = app.fareDistances[stationID];
      // if desc is not kept in fareDistances, use it as the distance
      // fareDistances may be 0
      if(fareDistances.length < desc.id || fareDistances[desc.id] === undefined) {
        fareDistances[desc.id] = desc.dist;
        
        // add connections to PQueue
        for(var c in connections[desc.id]) {
          if(connections[desc.id][c]) {
            insertPQueue(connectionPQueue, {
              id: parseInt(c),
              dist: desc.dist + connections[desc.id][c]
            });
          }
        }
      }
    }
  }
  
  // load all data and calculate fare distances
  // async
  function init() {
    return Promise.all([
      loadStations(app.config.dataFiles.stations),
      loadFares(app.config.dataFiles.fares)
    ]).then(calculateFareDistances);
  }
  
  // expose functions
  app.model = {
    init: init    
  };
  
})(window.MTRDP);
