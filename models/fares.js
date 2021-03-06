// Fare related data
(function(app) {
  
  // connections of each stations
  const connections = {};
  
  // estimated distance between station using sum of one station fares 
  // interchanges count as one station (using min fare)
  const fareDist = {};
  
  // fare table
  const fares = {};
  
  // minimum fare
  let minFare = Infinity;
  
  // nodes and edges for fare distance calculation
  const nodes = {};
  const edges = {};

  // cache for distance calculation
  const searchCache = {};
  
  // initialize lines
  const init = async () => {
    await app.loadAll([
      'CONF',
      'DIS', 
      'DATA',
      'OPT',  // for global option
      'LINES',
    ]);
    
    const fareData = await collectFares();
    calculateFareDist(fareData);

  };
  
  // collect fares of stations pairs
  const collectFares = async () => {
    const fareData = await app.DATA.loadCSV(app.CONF.files.fares);
    const stations = app.LINES.getStations();

    stations.forEach(s1 => {
      fares[s1] = {};
    });
    fareData.forEach(fare=> {
      if(fares.hasOwnProperty(fare['SRC_STATION_ID']) && fares.hasOwnProperty(fare['DEST_STATION_ID'])) {
        const adtFare = parseFloat(fare['OCT_ADT_FARE']);
        fares[fare['SRC_STATION_ID']][fare['DEST_STATION_ID']] = adtFare;
        if(adtFare > 0 && adtFare < minFare) {
          minFare = adtFare;
        }
      }
    });

    return fareData;
  };
  
  // calculate fare distance()
  const calculateFareDist = (fareData) => {
    
    // major node per station
    const stations = app.LINES.getStations();
    stations.forEach( s1=> {
      nodes['m-'+s1] = s1;
      edges['m-'+s1] = {};
      searchCache['m-'+s1] = {};
    });
    
    // join major node to station/line/dir node with zero cost
    // add edges along the line/dir
    const lineDirs = app.LINES.getLineDirs();
    for(const lineDir in lineDirs) {
      if(lineDirs.hasOwnProperty(lineDir)) {
        lineDirs[lineDir].forEach(s1 => {
          nodes[lineDir+'-'+s1] = s1;
          
          edges['m-'+s1][lineDir+'-'+s1] = 0;
          edges[lineDir+'-'+s1] = {};
          edges[lineDir+'-'+s1]['m-'+s1] = minFare; // penalty for interchange

          searchCache[lineDir+'-'+s1] = {};
        });
        for(let s = 0; s < lineDirs[lineDir].length-1; ++s) {
          const s1 = lineDirs[lineDir][s];
          const s2 = lineDirs[lineDir][s+1];
          // penalty for station count
          edges[lineDir+'-'+s1][lineDir+'-'+s2] = parseFloat((fares[s1][s2]+minFare/5).toFixed(3));
        }
      }
    }
    
    // add connected station (zero fares) 
    // except for special interchanges
    for(const s1 in fares) {
      if(fares.hasOwnProperty(s1)) {
        for(const s2 in fares[s1]) {
          if(fares[s1].hasOwnProperty(s2)) {
            if(s1 !== s2 && fares[s1][s2] === 0) {
              if(Object.values(app.CONF.specialInterchange).filter(
                stations => (s1 == stations[0] && s2 == stations[1] || s1 == stations[1] && s2 == stations[0]) 
              ).length === 0) {
                edges['m-'+s1]['m-'+s2] = 0;
                edges['m-'+s2]['m-'+s1] = 0;
              }
            }
          }
        }
      }
    }

    // Make sure triangular distance is valid 
    // first make a copy of fares
    const fixedFares = {};
    stations.forEach( s1=> {
      fixedFares[s1] = {};
      stations.forEach( s2=> {
        fixedFares[s1][s2] = fares[s1][s2];
      })
    });

    // next, fix triangular distance property
    stations.forEach( s1=> {
      stations.forEach( s2=> {
        if(s1 !== s2) {
          stations.forEach( s3 => {
            if(s1 !== s3 && s2 !== s3) {
              if(fares[s1][s3] + fares[s3][s2] < fixedFares[s1][s2]) {
                fixedFares[s1][s2] = fares[s1][s3] + fares[s3][s2];
              }
            }
          });
        }
      });
    });    
    
    // finally, make it symmetrical
    stations.forEach( s1=> {
      stations.forEach( s2=> {
        if(s1 <= s2) {
          const fare = Math.min(fares[s1][s2], fares[s2][s1]);
          fixedFares[s1][s2] = fare;
          fixedFares[s2][s1] = fare;
        }
      })
    })

        
    // calculate fare distance by shortest path search
    stations.forEach( s1=> {
      fareDist[s1] = {};
      stations.forEach( s2=> {
        if(s1 === s2) {
          fareDist[s1][s2] = 0;
        } else {  
          fareDist[s1][s2] = aStarSearch(s1, s2, fixedFares);
        }
      });
    });    
  };
  
  // aStarSearch on directed graph from station s1 to s2
  // using h as heuristics
  const aStarSearch = (s1, s2, h) => {

    const history = {};
    const n1 = 'm-'+s1;
    const n2 = 'm-'+s2;
    const pQueue = [{node:'m-'+s1, cost: 0, est: h[s1][s2], path: [n1]}];
    history[n1] = 0;
    let minCost = Infinity;
    let minPath = null;
    while(pQueue.length > 0) {
      const state = pQueue.pop();

      for(const n3 in edges[state.node]) {
        if(edges[state.node].hasOwnProperty(n3)) {
          let path = state.path.concat([n3]);
          // bound cost by fare so that heuristics is always optimal
          let pathCost = parseFloat((state.cost+edges[state.node][n3]).toFixed(3));
          // pruning by cost
          if(!history.hasOwnProperty(n3) || pathCost < history[n3]) {
            history[n3] = pathCost;
            const pathEst = parseFloat((pathCost + h[nodes[n3]][s2]).toFixed(3));
            if(n3 === n2) { // reached goal, check minimum cost
              if(pathCost < minCost) {
                minCost = pathCost;
                minPath = path;
              }
            } else  { 
              
              // check if there is a cache to be used
              if(searchCache[n3].hasOwnProperty(n2)) { // cache available
                const cachePath = path.concat(searchCache[n3][n2].path.slice(1));                
                const cacheCost = pathCost + searchCache[n3][n2].cost;
                if(cacheCost < minCost) {
                  minCost = cacheCost;
                  minPath = cachePath;
                }
              } else if(pathEst < minCost) { // add only if cost less than minimum cost
                let i = 0;
                while(i<pQueue.length && pQueue[i].est > pathEst) {
                  ++i;
                }
                pQueue.splice(i, 0, {node: n3, cost: pathCost, est: pathEst, path: state.path.concat([n3])});
              }
            }
          }
        }
      }
      
    }
    
    // add all subpath ends with the target to cache
    let pCost = 0
    for(let p = minPath.length-2; p >= 0; --p) {
      pCost += edges[minPath[p]][minPath[p+1]];

      if(!searchCache[minPath[p]].hasOwnProperty(n2)) {
        searchCache[minPath[p]][n2] = { cost: pCost, path: minPath.slice(p) };
      }
    }

    return minCost;
  };
  
  // find possible itineraries from s1 to s2
  const getItineraries = (s1, s2, opt) => {
    opt = opt || {};

    const result = [];
    
    // determine if transit is preferred by options
    let forceTransit = false;
    const ftDisCode = app.DIS.getCode('DIS_SHOW_TRANSIT');
    if(app.DIS.discounts.hasOwnProperty(ftDisCode)) {
      forceTransit = app.OPT.get(ftDisCode);
    }
    
    // direct trip, go through special transit if needed
    const directItin = getItinerary(s1, s2, { disOpt: opt });
    result.push(directItin);
    
    // if direct trip did not use interchange, force it if needed
    if(directItin.itin.length === 1 && forceTransit) {
      const transitTrip = getAlternativeItinerary(directItin, opt);
      if(transitTrip) {
        result.push(transitTrip);
      }
    }
    
    const daypassS1List = (app.CONF.dayPass.stations.indexOf(s1) >= 0?[s1]:app.CONF.dayPass.stations);
    const daypassS2List = (app.CONF.dayPass.stations.indexOf(s2) >= 0?[s2]:app.CONF.dayPass.stations);
    
    const passCases = [];
    
    daypassS1List.forEach(dps1 => {
      daypassS2List.forEach(dps2 => {
        if(dps1 !== dps2) {
          let passCase = [];
          let totalDist = 0;
          
          let passTCase = [];
          let totalTDist = 0;
          let hasAlternativeItin = false;
          
          if(s1 !== dps1) {
            const preTrip = getItinerary(s1, dps1, { disOpt: opt });
            passCase = passCase.concat(preTrip.itin);
            totalDist += getTotalDist(preTrip.itin);
            // consider case of forced transit 
            if(preTrip.length === 1 && forceTransit) {
              const transitTrip = getAlternativeItinerary(preTrip, opt);
              if(transitTrip) {
                passTCase = passTCase.concat(transitTrip.itin);
                totalTDist += getTotalDist(transitTrip.itin);
                hasAlternativeItin = true;
              } else {
                passTCase = passTCase.concat(preTrip.itin);
                totalTDist += getTotalDist(preTrip.itin);
              }
            }
          }
          if(passCase.length > 0) {
            passCase[passCase.length-1].transitFrom = 'daypass';
            if(passTCase.length > 0) {
              passTCase[passTCase.length-1].transitFrom = 'daypass';
            }
          }
          passCase.push({from: dps1, to: dps2, usePass: true, transitTo: 'daypass' });
          totalDist += fareDist[dps1][dps2];
          
          if(passTCase.length > 0) {
            passTCase.push({from: dps1, to: dps2, usePass: true});
            totalTDist += fareDist[dps1][dps2];
          }
          
          if(s2 != dps2) {
            const postTrip = getItinerary(dps2, s2, { disOpt: opt });
            passCase = passCase.concat(postTrip.itin);
            totalDist += getTotalDist(postTrip.itin);

            // consider case of forced transit 
            if(passTCase.length > 0) {
              const transitTrip = getAlternativeItinerary(postTrip, opt);
              if(transitTrip) {
                passTCase = passTCase.concat(transitTrip.itin);
                totalTDist += getTotalDist(transitTrip.itin);
                hasAlternativeItin = true;
              } else {
                passTCase = passTCase.concat(postTrip.itin);
                totalTDist += getTotalDist(postTrip.itin);
              }
            }
          }
          
          totalDist = parseFloat(totalDist.toFixed(3));
          passCases.push({ itin: passCase, dist: totalDist, passDist: fareDist[dps1][dps2], fare: calFare(passCase, { disOpt: opt }) });
          if(hasAlternativeItin) {
            totalTDist = parseFloat(totalTDist.toFixed(3));
            passCases.push({ itin: passTCase, dist: totalDist, passDist: fareDist[dps1][dps2], fare: calFare(passTCase, { disOpt: opt }) });
          }
        }
      });
    });  
    
    // decide which case should be included.
    // first find the one with least dist / max pass dist then fare
    passCases.sort((a, b) => {
      if(a.dist !== b.dist) {
        return b.dist - a.dist; // less dist first
      }
      if(a.passDist !== b.passDist) {
        return a.passDist - b.passDist; // then longer day-pass trip
      }
      return b.fare - a.fare; // then lesser price
    });
    
    // include all cases that has lower fare then the current min
    //  of same dist as the previous and lower then the previous min
    let currMinFare = Infinity;
    while(passCases.length > 0) {
      const passCase = passCases.pop();
      if(passCase.fare < currMinFare) {
        currMinFare = passCase.fare;
        currDist = passCase.dist;
        result.push({ itin: passCase.itin, dist: passCase.dist, passdist: passCase.passDist, fare: passCase.fare, usePass: true });
      }
    }

    return result;
  };
  

  // find route from s1 to s2
  const getItinerary = (s1, s2, opt) => {
    opt = Object.assign({ disOpt: {}, transit: false }, opt || {});
    
    // direct
    let trips = [{ from: s1, to: s2 }];
    let tripDist = fareDist[s1][s2];
    
    // test interchange
    for(const sc in app.CONF.specialInterchange) {
      if(app.CONF.specialInterchange.hasOwnProperty(sc)) {
        const changeStations = app.CONF.specialInterchange[sc];
        let spTrip, spTripDist;
        const dist01 = fareDist[s1][changeStations[0]] + fareDist[changeStations[1]][s2];
        const dist10 = fareDist[s1][changeStations[1]] + fareDist[changeStations[0]][s2];
        
        if(dist01 <= dist10 && (dist01 < tripDist || opt.transit)) {
          tripDist = dist01;
          trips = [{ from: s1, to: changeStations[0], transitFrom: sc }, { from: changeStations[1], to: s2, transitTo: sc }]
        } else if(dist01 > dist10 && (dist10 < tripDist || opt.transit)) {
          tripDist = dist10;
          trips = [{ from: s1, to: changeStations[1], transitFrom: sc }, { from: changeStations[0], to: s2, transitTo: sc }]
        }
      }
    }
    
    return { itin: trips, dist: parseFloat(tripDist.toFixed(3)), passDist: 0, fare: calFare(trips, opt), usePass: false, transitForced: opt.transit };
  };
  
  const getAlternativeItinerary = (original, opt) => {
    const s1 = original.itin[0].from;
    const s2 = original.itin[original.itin.length-1].to;
    
    const transitTrip = getItinerary(s1, s2, { disOpt: opt, transit: true });
    if(transitTrip.fare < original.fare) { // if transit is cheaper
      // add only if extra dist is within acceptable range
      if(transitTrip.dist - original.dist < app.CONF.interchange.acceptRate * minFare) {
        return transitTrip;
      }
    }
    return null;
  };
  
  const getTotalDist = (itin) => {
    let totalDist = 0;
    itin.forEach(trip => {
      totalDist += fareDist[trip.from][trip.to];
    });
    return parseFloat(totalDist.toFixed(3));
  };
    
  // calculate fare with discount
  const calFare = (trips, opt) => {
    opt = Object.assign({ disOpt: {} }, opt || {});

    let total = 0;
    let nonFree = false;

    for(let t = 0; t < trips.length; ++t) {
      const trip = trips[t];
      if(!trip.usePass) { // no cost if use pass
        const thisFare = fares[trip.from][trip.to];
        let actualFare = thisFare;
        
        // calculate actual fare in case of transit
        if(t > 0 && trip.hasOwnProperty('transitTo')) {
          const lastTo = trips[t-1].to;
          actualFare = fares[trips[t-1].from][trip.to] - fares[trips[t-1].from][trips[t-1].to];
        }
        
        // discount is calculated with normal fare
        let discount = 0;
        if(actualFare > 0) {
          nonFree = true;
          for(const disCode in app.DIS.discounts) {
            if(app.DIS.discounts.hasOwnProperty(disCode)) {
              const dis = app.DIS.discounts[disCode];
              if(app.DIS.hasFareDiscount(dis)) {
                const isGlobal = app.DIS.isGlobal(dis);
                if((isGlobal && app.OPT.get(disCode)) ||
                (!isGlobal && opt.disOpt[disCode])) {
                  discount += dis.getDiscount(thisFare, { 
                    src: trip.from, dest: trip.to,
                    transit: trip.hasOwnProperty('transitFrom')?trip.transitFrom:null,
                    isFirst: t===0,
                    isLast: t===trips.length-1,
                  });
                }
              }
            }
          }
        }
        // discount cannot exceed actual fare
        discount = Math.min(actualFare, discount);
        total += actualFare - discount;
      }
      
      // discount cannot exceed current total
      if(total < 0) {
        total = 0;
      }
    }
    
    return parseFloat(total.toFixed(3));
  };
  
  app.FARES = {
    init: init,
    getItineraries: getItineraries
  };
  
}(window.MTRDP));
