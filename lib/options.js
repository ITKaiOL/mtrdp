// Option utilities (for discount choice)
(function(app) {
  
  // available (global) discount
  const discounts = {};
  // current selected discount
  let currentOptions = {};
  
  // initialize discounts
  const init = async () => {
    await app.loadAll([
      'DIS', 
      'STATE' // need STATE to be loaded first
    ]);
    initDiscount();
  };
  
  // get specific option status
  const optGet = (discount) => {
    if(currentOptions.hasOwnProperty(discount)) {
      return currentOptions[discount];
    }
    return null;
  };
  // set speific option status
  const optSet = (discount, value) => {
    if(currentOptions.hasOwnProperty(discount)) {
      currentOptions[discount] = value;
      app.STATE.set('do', discount, value, {defaultTrue: true});
    }
  };
  
  // grab global discount options from available discounts
  const initDiscount = () => {
    const savedOptions = app.STATE.getAll('do');
    for(const disCode in app.DIS.discounts) {
      if(app.DIS.discounts.hasOwnProperty(disCode)) {
        const dis = app.DIS.discounts[disCode];
        if(app.DIS.isGlobal(dis)) {
          discounts[disCode] = dis;
          if(savedOptions.hasOwnProperty(disCode)) {
            currentOptions[disCode] = !!savedOptions[disCode];
            if(currentOptions[disCode]) {
              // clear option if it is the default already
              app.STATE.clear('do', disCode);
            }
          } else {
            currentOptions[disCode] = true;
          }
        }
      }
    }
    // clear unavailable discounts
    for(const savedDis in savedOptions) {
      let found = false;
      for(const disCode in app.DIS.discounts) {
        if(app.DIS.discounts.hasOwnProperty(disCode)) {
          if(disCode == savedDis) {
            found = true;
            break;
          }
        }
      }
      if(!found) {
        app.STATE.clear('do', savedDis);
      }
    }
  }
  
  app.OPT = {
    init: init,
    discounts: discounts,
    get: optGet,
    set: optSet,
  };
  
}(window.MTRDP));
