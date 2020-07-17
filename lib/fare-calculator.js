(function(app) {
  
  // Trip object, travel from srcID to destID
  // via special interchange
  // uses pass (or not)
  function Trip(srcID, destID, via, uses) {
    this.srcID = srcID;
    this.destID = destID;
    this.via = via;
    this.uses = uses;
  }
  // render trip into sequence of span elements
  Trip.prototype.render = function(options) {
    var elements = [];
    if(options && options.renderUses) {
      elements.push(app._$.create('span', { 'data-string': '('+this.uses+')' }));
    }
    elements.push(app._$.create('span', { 'data-station': this.srcID }));
    elements.push(app._$.create('span', null, ['→']));
    if(this.via) {
      elements.push(app._$.create('span', { 'data-string': 'via-'+this.via.src+'/'+this.via.dest }));
      elements.push(app._$.create('span', null, ['→']));
    }
    elements.push(app._$.create('span', { 'data-station': this.destID }));
    return elements;
  };
  
  // Itinerary object that used in all returns
  function Itinerary() {
    this.fare = 0;
    this.dist = 0;
    this.trips = [];
  }
  Itinerary.prototype.addTrip = function(fare, dist, trip) {
    this.fare += fare;
    this.dist += dist;
    this.trips.push(trip);
  }
  Itinerary.prototype.mergeItinerary = function(itin) {
    var newItin = new Itinerary();
    newItin.fare = this.fare + itin.fare;
    newItin.dist = this.dist + itin.dist;
    newItin.trips = this.trips.concat(itin.trips);
    return newItin;
  };
  // render itinerary into sequence of span elements
  Itinerary.prototype.render = function() {
    var options = {};
    if(this.trips.length > 1) {
      options.renderUses = true;
    }
    
    return this.trips.reduce(function(elements, trip) { 
      return elements.concat(trip.render(options)); 
    }, []);
  }
  // compare to another itinerary, correct to 2 dp
  // always return true if itin is null
  Itinerary.prototype.lessThan = function(itin) {
    
    if(itin === null) {
      return true;
    }
    
    // return based on fare
    var fare1 = Math.round(this.fare*100);
    var fare2 = Math.round(itin.fare*100);    
    if(fare1 < fare2) {
      return true;
    } else if(fare1 > fare2) {
      return false;
    }
    
    // return based on dist
    var dist1 = Math.round(this.dist*100);
    var dist2 = Math.round(itin.dist*100);    
    if(dist1 < dist2) {
      return true;
    } else if(dist1 > dist2) {
      return false;
    }

    // return based on the distance with daypass
    var dpDist1 = 0;
    this.trips.forEach(function(trip) {
      if(trip.uses === 'dayPass') {
        dpDist1 = app.fareDistances[trip.srcID][trip.descID];
      }
    });
    var dpDist2 = 0;
    itin.trips.forEach(function(trip) {
      if(trip.uses === 'dayPass') {
        dpDist2 = app.fareDistances[trip.srcID][trip.descID];
      }
    });
    
    return dpDist1 > dpDist2;
  
  }
  
  // Determine if a itenerary is worthy comparing to a direct trip
  // consider fare-distance ratio of a direct trip, trip is worthy if fare saved 
  //   is more than the extra fare of the distance travelled
  // need to know the current options
  Itinerary.prototype.isWorthy = function(options) {

    var directItin = getItinDirect(this.trips[0].srcID, this.trips[this.trips.length-1].destID, options);
    var distDiff = this.dist - directItin.dist;
    var fareDiff = this.fare - directItin.fare;
    
    // if save more 
    if(fareDiff < 0) {
      // if shorter distance or amount saved is proportional to the fare distance added
      if(distDiff < 0 || -fareDiff/directItin.fare > distDiff/directItin.dist) {
        return true;
      }
    }
    
    return false;
  }
  
  
  // calculate fare without special interchange
  function getItinDirect(srcID, destID, options) {
    var baseFare = Math.max(app.minFare, app.fares[srcID][destID]);
    
    // directfare
    var discount = 0;
    if(options.discount20) {
      discount += Math.ceil(baseFare * app.config.discount20.discountRate * 10)/10;
    }
    if(options.earlyBird) {
      discount += Math.ceil(baseFare * app.config.earlyBird.discountRate * 10)/10;
    }
    var it = new Itinerary();
    it.addTrip(baseFare - discount, app.fareDistances[srcID][destID], new Trip(srcID, destID, null, 'octopus'));
    return it;  
  }
  
  function getInterchangeTST(srcID, destID) {
    // find interchange stations
    var srcInterchange = app.config.specialInterchange.tst[0];
    var srcInterchangeDist = app.fareDistances[srcID][srcInterchange];
    for(var i = 1; i < app.config.specialInterchange.tst.length; ++i) {
      var interchange = app.config.specialInterchange.tst[i];
      var dist = app.fareDistances[srcID][interchange];
      if(dist < srcInterchangeDist) {
        srcInterchange = interchange;
        srcInterchangeDist = dist;
      }
    }
    
    var destInterchange = app.config.specialInterchange.tst[0];
    var destInterchangeDist = app.fareDistances[destInterchange][destID];
    for(var i = 1; i < app.config.specialInterchange.tst.length; ++i) {
      var interchange = app.config.specialInterchange.tst[i];
      var dist = app.fareDistances[interchange][destID];
      if(dist < destInterchangeDist) {
        destInterchange = interchange;
        destInterchangeDist = dist;
      }
    }
    return {
      src: srcInterchange,
      dest: destInterchange
    };
  }
  
  // calculate fare with special interchange at TST
  // Still not able to figure out what happens if the second trip needs a refund
  function getItinTST(srcID, destID, options) {
    var baseFare = Math.max(app.minFare, app.fares[srcID][destID]);
    
    // find interchange stations
    var interchanges = getInterchangeTST(srcID, destID);
    var srcInterchange = interchanges.src;
    var destInterchange = interchanges.dest;
    
    var srcInterchangeDist = app.fareDistances[srcID][srcInterchange];
    var destInterchangeDist = app.fareDistances[destInterchange][destID];

    // allow interchange if appropriate
    if(srcInterchange === destInterchange) {
      return null;
    }
    
    var discount = 0;
    
    var firstTrip = app.fares[srcID][srcInterchange];
    if(options.discount20) {
      discount += Math.ceil(firstTrip * app.config.discount20.discountRate * 10)/10;
    }
    if(options.earlyBird) {
      discount += Math.ceil(firstTrip * app.config.earlyBird.discountRate * 10)/10;
    }
    
    var secondTrip = baseFare - firstTrip;
    // discount only if second trip price is positive
    if(secondTrip > 0) {
      var secondTripOriginal = app.fares[destInterchange][destID];
      if(options.discount20) {
        discount += Math.ceil(secondTripOriginal * app.config.discount20.discountRate * 10)/10;
      }
      if(options.earlyBird) {
        discount += Math.ceil(secondTripOriginal * app.config.earlyBird.discountRate * 10)/10;
      }
    } else {
      
      var minFare = app.minFare;
      var minFareDiscount = 0;
      if(options.discount20) {
        minFareDiscount += Math.ceil(minFare * app.config.discount20.discountRate * 10)/10;
      }
      if(options.earlyBird) {
        minFareDiscount += Math.ceil(minFare * app.config.earlyBird.discountRate * 10)/10;
      }
      minFare -= minFareDiscount;
      discount = baseFare - Math.max(baseFare - discount, minFare);
    }
    
    // fare distance difference comparing to not interchanging
    var tstFare = baseFare - discount;
    var tstDist = srcInterchangeDist + destInterchangeDist;
    var it = new Itinerary();
    it.addTrip(tstFare, tstDist, 
               new Trip(srcID, destID, interchanges, 'octopus'));
    if(it.isWorthy(options)) {
      return it;
    }
    
    // not good going through TST
    return null;

  }
  

  // determine trip cost and option without dayPass
  function getItinerary(srcID, destID, options) {
    
    var directItin = getItinDirect(srcID, destID, options);

    // no need to consider TST if src/desc is TST
    if(srcID === app.config.specialInterchange.tst[0] ||
      srcID === app.config.specialInterchange.tst[1] ||
      destID === app.config.specialInterchange.tst[0] ||
      destID === app.config.specialInterchange.tst[1]
    ) {
      return directItin;
    }
    
    var tstItin = getItinTST(srcID, destID, options);
    
    // determine best path
    if(tstItin && directItin.fare > tstItin.fare) {
      return tstItin;
    }
    return directItin;
  }
  
  // determine route and fare with day pass 
  function getItinDaypass(srcID, destID, options) {
    
    var dayPassItin = new Itinerary();
    
    // check if src/dest within day pass stations
    var srcCovered = (app.config.dayPass.stations.indexOf(srcID) >= 0);
    var destCovered = (app.config.dayPass.stations.indexOf(destID) >= 0);
    if(srcCovered && destCovered) {
      // use pass if both covered
      dayPassItin.addTrip(0, app.fareDistances[srcID][destID], new Trip(srcID, destID, null, 'dayPass'));
      return dayPassItin;
    }
    
    // get all possible interchange station from src
    var preItineraries = null;
    if(!srcCovered) {
      preItineraries = app.config.dayPass.stations.map(function(station) {
        return getItinerary(srcID, station, options);
      });
    }
    
    // get all possible interchange station to dest and pick the best
    var postItineraries = null;
    if(!destCovered) {
      postItineraries = app.config.dayPass.stations.map(function(station) {
        return getItinerary(station, destID, options);
      });
    }
    
    // if only srcCovered, find with best dayPass trip + postTrip that is worhty
    if(srcCovered) {
      var bestItin = postItineraries.reduce(function(bestItin, coveredItin) {
        var postStation = coveredItin.trips[0].srcID;
        if(postStation === srcID) {
          return bestItin;
        }
        var thisItin = new Itinerary();
        var dayPassDist = app.fareDistances[srcID][postStation];
        thisItin.addTrip(0, dayPassDist, new Trip(srcID, postStation, null, 'dayPass'));
        thisItin = thisItin.mergeItinerary(coveredItin);
        if(thisItin.isWorthy(options) && thisItin.lessThan(bestItin)) {
             bestItin = thisItin;
        }
        return bestItin;
      }, null);
      
      return bestItin;
    }

    // if only destCovered, find with best preTrip + dayPass trip that is worhty
    if(destCovered) {
      var bestItin = preItineraries.reduce(function(bestItin, coveredItin) {
        var preStation = coveredItin.trips[coveredItin.trips.length-1].destID;
        if(preStation === destID) {
          return bestItin;
        }
        var thisItin = new Itinerary();
        var dayPassDist = app.fareDistances[preStation][destID];
        thisItin.addTrip(0, dayPassDist, new Trip(preStation, destID, null, 'dayPass'));
        thisItin = coveredItin.mergeItinerary(thisItin);
        if(thisItin.isWorthy(options) && thisItin.lessThan(bestItin)) {
             bestItin = thisItin;
        }
        return bestItin;
      }, null);
      
      return bestItin;
    }
    
    // both stations are not covered
    return preItineraries.reduce(function(bestItin, coveredPreItin) {
      return postItineraries.reduce(function(bestItin, coveredPostItin) {
        var preStation = coveredPreItin.trips[coveredPreItin.trips.length-1].destID;
        var postStation = coveredPostItin.trips[0].srcID;
        
        // skip if same station
        if(preStation === postStation) {
          return bestItin;
        }
        
        //check if worthy and better
        var thisItin = new Itinerary();
        thisItin.addTrip(0, app.fareDistances[preStation][postStation], new Trip(preStation, postStation, null, 'dayPass'));
        
        thisItin = coveredPreItin.mergeItinerary(thisItin);
        thisItin = thisItin.mergeItinerary(coveredPostItin);
      
        if(thisItin.isWorthy(options) && thisItin.lessThan(bestItin)) {
           bestItin = thisItin;
        }
        
        return bestItin;
        
      }, null);
    }, null);

  }
  
  // get an overview of round-trip fares with/without day pass
  function getOverview(stationID, options) {
    var fares = [];
    var lines = app.lines;
    // build options for the two trips
    var fwdOptions = {
      discount20: options.discount20,
      earlyBird: (options.earlyBird === 'fwd' || options.earlyBird === 'rnd')
    };
    var bakOptions = {
      discount20: options.discount20,
      earlyBird: (options.earlyBird === 'bak' || options.earlyBird === 'rnd')
    };
    // get trip for each station
    for(var lineCode in lines) {
      if(lines.hasOwnProperty(lineCode)) {
        
        var stations = app.lines[lineCode];
        for(var s = 0; s < stations.length; ++s) {
          var destID = stations[s];
          
          // ignore own station or handled
          if(stationID !== destID && (fares.length <= destID || !fares[destID])) {
            fares[destID] = {
              octopus: {
                fwd: getItinerary(stationID, destID, fwdOptions),
                bak: getItinerary(destID, stationID, bakOptions)
              },
              dayPass: {
                fwd: getItinDaypass(stationID, destID, fwdOptions),
                bak: getItinDaypass(destID, stationID, bakOptions)
              }
            };
        
          }
        }
      }
    }
    return fares;
  }
  
  // get a summary of a single-trip fares with/without day pass
  function getSummary(srcID, destID, options) {
    return {
      octopus: getItinerary(srcID, destID, options),
      dayPass: getItinDaypass(srcID, destID, options)
    };
  }
  
  // expose these functions
  app.fareCalculator = {
    getSummary: getSummary,
    getOverview: getOverview
  };
  
})(window.MTRDP);
