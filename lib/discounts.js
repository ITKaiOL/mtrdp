// define discount
(function(app) {
  
  // initialize available discounts
  const init = async () => {
    await app.load('DISDEF');
    // populate discounts from definitions
    app.DIS.discounts = app.DISDEF.defs;
  };
  
  app.DIS = {
    init: init,
    discounts: null, // load in initializer
    getCode: (name) => app.DISDEF.codes.hasOwnProperty(name)?app.DISDEF.codes[name]:null,
    isGlobal: (dis) => dis.type===app.DISDEF.types.DISTYPE_ALL_TRIP || dis.type===app.DISDEF.types.DISTYPE_NON_TRIP,
    hasFareDiscount: (dis) => dis.hasOwnProperty('getDiscount'),
    hasPassDiscount: (dis) => dis.hasOwnProperty('getPassDiscount'),
  };
  
}(window.MTRDP));
