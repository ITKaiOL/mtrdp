// define data source and supplementary info
(function(app) {
  
  app.CONF = {};
  app.CONF.source = 'https://github.com/ITKaiOL/mtrdp';
  app.CONF.date = '2024-06-13';
  app.CONF.newFareDate = '2024-06-30';
  app.CONF.hasNewFare = new Date() < new Date(app.CONF.newFareDate);
  app.CONF.useNew = false;
  if((typeof _useNew != "undefined" && _useNew)) {
    app.CONF.useNew = true;
  } else if((typeof _useNew == "undefined" || !_useNew) && app.CONF.newFareDate && new Date() >= new Date(app.CONF.newFareDate)) {
    app.CONF.useNew = true;
  }
  
  app.CONF.files = {
    stations: 'data/mtr_lines_and_stations.csv',
    fares: app.CONF.useNew?'data/mtr_lines_fares_tmpnew.csv':'data/mtr_lines_fares.csv'
  };
  
  // support these lines only
  app.CONF.lines = [ 
    'TML', 'TWL', 'KTL', 'ISL', 'EAL', 'TKL', 'TCL', 'DRL', 'SIL' 
  ];
  
  // special interchange
  app.CONF.specialInterchange = { 
    tst: ['3', '80'],  // TST <-> E.TST
  };
  
  // stations covered by day pass
  app.CONF.dayPass = {
    stations: ['120', '119', '118', '117', '116', '115', '114', '20', '53'],
    price: 29,
  };
  
  // acceptable unit of time to take interchange for lower fare
  app.CONF.interchange = {
    acceptRate: 2.5
  }  
}(window.MTRDP));
