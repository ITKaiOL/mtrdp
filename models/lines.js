// Line related data
(function(app) {
  
  const lineDirs = {};
  const lines = {};
  const stationInfo = {};
  
  // initialize lines
  const init = async () => {
    await app.loadAll([
      'CONF',
      'DATA'
    ]);
    
    // load data
    const lineData = await app.DATA.loadCSV(app.CONF.files.stations);
    
    // populate station info
    for(const row of lineData) {
      if(app.CONF.lines.indexOf(row['Line Code']) >= 0 &&
          !stationInfo.hasOwnProperty(row['Station ID'])) {
        stationInfo[row['Station ID']] = {
          id: row['Station ID'],
          nameEN: row['English Name'],
          nameZH: row['Chinese Name']
        };
      }
    }
    
    // keep a copy of raw line-direction data
    for(const row of lineData) {
      if(app.CONF.lines.indexOf(row['Line Code']) >= 0) {
        const lineDir = row['Line Code']+'-'+row['Direction'];
        if(!lineDirs.hasOwnProperty(lineDir)) {
          lineDirs[lineDir] = [];
        }
        lineDirs[lineDir].push(row['Station ID']);
      }
    }
    
    // group to lines of different directions
    const sublines = {};    
    for(const row of lineData) {
      if(app.CONF.lines.indexOf(row['Line Code']) >= 0) {
        if(!sublines.hasOwnProperty(row['Line Code'])) {
          sublines[row['Line Code']] = {
            DT: {},
            UT: {},
            XX: {}
          };
        }
        let d1, d2;
        switch(true) {
          case row['Direction'].indexOf('DT') >= 0:
            d1 = 'DT',
            d2 = row['Direction'].replace(/DT/,'');
            break;
          case row['Direction'].indexOf('UT') >= 0:
            d1 = 'UT',
            d2 = row['Direction'].replace(/UT/,'');
            break;
          default:
            d1 = 'XX',
            d2 = row['Direction'];
            break;
        }
        if(!sublines[row['Line Code']][d1].hasOwnProperty(d2)) {
          sublines[row['Line Code']][d1][d2] = [];
        }
        sublines[row['Line Code']][d1][d2].push(row['Station ID']);
      }
    }
    
    // build station lists for each line
    for(const lineCode in sublines) {
      if(sublines.hasOwnProperty(lineCode)) {
        const line = sublines[lineCode];
        // merge DT lines
        dirDT = Object.keys(line.DT).sort();
        let stationsDT = [];
        for(const dir of dirDT) {
          stationsDT = mergeLines(stationsDT, line.DT[dir]);
        }
        // merge UT lines
        dirUT = Object.keys(line.UT).sort();
        let stationsUT = [];
        for(const dir of dirUT) {
          stationsUT = mergeLines(stationsUT, line.UT[dir]);
        }
        // merge DT and UT reversed
        const stations = mergeLines(stationsDT, stationsUT.reverse());
        
        // add stations from other directions
        for(const dir in line.XX) {
          if(line.XX.hasOwnProperty(dir)) {
            for(const station of line.xx[dir]) {
              if(stations.indexOf(station) < 0) {
                stations.push(station);
              }
            }
          }
        }
        lines[lineCode] = stations;
      }
      
    }
    
  };
  
  const mergeLines = (line1, line2) => {
    const result = [];
    let idx1 = 0; 
    let idx2 = 0;
    
    while(idx1 < line1.length) {
      // find first match on both sides
      let match11 = idx1;
      let match12 = line2.length;
      while(match11 < line1.length) {
        match12 = line2.indexOf(line1[match11]);
        if(match12 >= 0) break;
        match11++;
      }
      let match21 = line1.length;
      let match22 = idx2;
      while(match22 < line2.length) {
        match21 = line1.indexOf(line2[match22]);
        if(match21 >= 0) break;
        match22++;
      }
      
      // pick earliest match
      let match1, match2;
      if(match11 <= match22) {
        match1 = match11;
        match2 = match12;
      } else {
        match1 = match21;
        match2 = match22;
      }
      
      // merge everything before match1/match2, add the longer side first
      if(match1 - idx1 > match2 - idx2) {
        while(idx1 < match1) {
          if(result.indexOf(line1[idx1]) < 0) {
            result.push(line1[idx1]);
          }
          idx1++;
        }
        while(idx2 < match2) {
          if(result.indexOf(line2[idx2]) < 0) {
            result.push(line2[idx2]);
          }
          idx2++;
        }
      } else {
        while(idx2 < match2) {
          if(result.indexOf(line2[idx2]) < 0) {
            result.push(line2[idx2]);
          }
          idx2++;
        }
        while(idx1 < match1) {
          if(result.indexOf(line1[idx1]) < 0) {
            result.push(line1[idx1]);
          }
          idx1++;
        }          
      }
      
      // add the match
      if(match1 < line1.length && match2 < line2.length) {
        if(result.indexOf(line1[match1]) < 0) {
          result.push(line1[idx1]);
        }
        idx1++;
        idx2++;
      }
    }
    
    // add remaining
    while(idx2 < line2.length) {
      if(result.indexOf(line2[idx2]) < 0) {
        result.push(line2[idx2]);
      }
      idx2++;
    }
    
    return result;
  };
  
  const getLine = (lineCode) => lines[lineCode].slice();
  const getInfo = () => stationInfo;
  const getLineDirs = () => lineDirs;
  const getStations = () => Object.keys(stationInfo);
  const hasStation = (stationID) => stationInfo.hasOwnProperty(stationID);
  
  app.LINES = {
    init: init,
    getLine: getLine,
    getInfo: getInfo,
    getLineDirs: getLineDirs,
    getStations: getStations,
    hasStation: hasStation
  };
  
}(window.MTRDP));
