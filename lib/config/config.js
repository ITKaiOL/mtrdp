// maintain main configurations of the app
(function(app) {
  
  app.config.sourceLink = 'https://github.com/ITKaiOL/mtrdp';
  app.config.dataTime = '2020-07-10';
  
  app.config.dataFiles = {
    stations: 'data/mtr_lines_and_stations.csv',
    fares: 'data/mtr_lines_fares.csv'
  };
  
  // support these lines only
  app.config.supportedLines = [ 'WRL', 'TWL', 'KTL', 'ISL', 'EAL', 'TML', 'TKL', 'TCL', 'DRL', 'SIL' ];
  
  // special change station -- needed for discount calcuation
  app.config.specialInterchange = { tst: [3, 80] };
  
  // stations covered by day pass
  app.config.dayPass = {
    stations: [120, 119, 118, 117, 116, 115, 114, 20, 53],
  //  interchanges: [20, 53],
    price: 28,
    '10for1Price': 28 * 10 / 11
  };
  // Stations that supports early bird discount
  // http://www.mtr.com.hk/ch/customer/main/early_bird_t&c.html
  app.config.earlyBird = {
    stations: [
      // Hung Hom to Kowloon Tong
      64, 65, 8,
      // Sheung Wan to Tai koo
      26, 1, 2, 27, 28, 29, 30, 31, 32, 33,
      // Whampo to Yau Tong
      85, 84, 5, 6, 16, 7, 8, 9, 10, 11, 12, 13, 14, 15, 38, 48,
      // Admiralty to South Horizon
      2, 86, 87, 88, 89,
      // Central to Mei Foo
      1, 2, 3, 4, 5, 6, 16, 17, 18, 19, 20,
      // Hong Kong to Nam Cheong
      39, 40, 41, 53,
      // Diamond hill to Kai Tak
      11, 91,
      // Hung Hom to Mei Foo
      64, 80, 111, 53, 20,
      // North Point to Yau Tong
      31, 32, 48,
    ],
    discountRate: 0.35,
  };
  // http://www.mtr.com.hk/ch/customer/main/fare-relief-terms.html
  app.config.discount20 = {
    discountRate: 0.2,
  };
  
})(window.MTRDP);
