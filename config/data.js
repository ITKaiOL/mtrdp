// define data source and supplementary info
(function(app) {
  
  app.CONF = {};
  
  app.CONF.source = 'https://github.com/ITKaiOL/mtrdp';
  app.CONF.date = '2021-06-27';
  
  app.CONF.files = {
    stations: 'data/mtr_lines_and_stations.csv',
    fares: 'data/mtr_lines_fares.csv'
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
    price: 28,
  };
  
  // acceptable unit of time to take interchange for lower fare
  app.CONF.interchange = {
    acceptRate: 2.5
  }  
}(window.MTRDP));
