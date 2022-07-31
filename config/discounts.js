// define discount
(function(app) {
  
  // discount types
  const disTypes = {
    DISTYPE_ALL_TRIP:   1, // discount for all trip
    DISTYPE_PER_TRIP:   2, // for individual trip
    DISTYPE_NON_TRIP:  10, // this affects available choice only
  };
  
  // discount codes
  const disCodes = {
    DIS_EARLY_BIRD:        1, // early bird discount
    DIS_EARLY_BIRD_TST:    2, // early bird discount (b/f TST interchange)
    DIS_EARLY_BIRD_DP:     3, // early bird discount (b/f day pass)
    DIS_DAY_PASS_TEN:     10, // day pass 10 for 1
    DIS_CEIL_FIVE:      1050, // 5% discount 
    DIS_CEIL_FIVE_2:    1038, // 5% discount -> 3.8%
    DIS_MINUS_TWO:      2002, // $2 discount
    DIS_SHOW_TRANSIT:   3001, // show extra transit choice
  };
  
  // discount utilities
  const discount_ceiling = (rate) => {
    return (fare) => Math.ceil(fare * rate * 10)/10;
  }
  // discount definitions
  const disDefs = {};
  
  // discount details
  const DIS_EARLY_BIRD_RATE = 0.35;
  const DIS_EARLY_BIRD_STATIONS = [
    // Admiralty to Kowloon Tong
    '2', '94', '64', '65', '8',
    // Sheung Wan to Tai koo
    '26', '1', '2', '27', '28', '29', '30', '31', '32', '33',
    // Whampo to Yau Tong
    '85', '84', '5', '6', '16', '7', '8', '9', '10', '11', '12', '13', '14', '15', '38', '48',
    // Admiralty to South Horizon
    '2', '86', '87', '88', '89',
    // Central to Mei Foo
    '1', '2', '3', '4', '5', '6', '16', '17', '18', '19', '20',
    // Hong Kong to Nam Cheong
    '39', '40', '41', '53',
    // Diamond hill to Mei Foo
    '11', '91', '92', '93', '84', '64', '80', '111', '53', '20',
    // North Point to Yau Tong
    '31', '32', '48',
  ];
  const DIS_EARLY_BIRD_DISCOUNT = (fare, info) => {
    if(DIS_EARLY_BIRD_STATIONS.indexOf(info.dest) >= 0) {
      return discount_ceiling(DIS_EARLY_BIRD_RATE)(fare);
    } else {
      return 0;
    }
  };
  disDefs[disCodes.DIS_EARLY_BIRD] = {
    type: disTypes.DISTYPE_PER_TRIP,
    name: 'early-bird',
    default: false,
    getDiscount: (fare, info) => {
      if(info.isLast) {
        return DIS_EARLY_BIRD_DISCOUNT(fare, info);
      } else {
        return 0;
      }
    }
  };
  
  disDefs[disCodes.DIS_EARLY_BIRD_TST] = {
    type: disTypes.DISTYPE_PER_TRIP,
    name: 'early-bird-tst',
    default: false,
    getDiscount: (fare, info) => {
      if(info.transit === 'tst') {
        return DIS_EARLY_BIRD_DISCOUNT(fare, info);
      } else {
        return 0;
      }
    }
  };
  
  disDefs[disCodes.DIS_EARLY_BIRD_DP] = {
    type: disTypes.DISTYPE_PER_TRIP,
    name: 'early-bird-dp',
    default: false,
    getDiscount: (fare, info) => {
      if(info.transit === 'daypass') {
        return DIS_EARLY_BIRD_DISCOUNT(fare, info);
      } else {
        return 0;
      }
    }
  };
   
  // discount details
  // Note: except for the first day pass, you get one free for every 9 
  //       more purchases. Thus it is a 10% discount if this goes on forever.
  //       
  // Setting the rate to 9.9% as life won't be perfect. Oops.
  const DIS_DAY_PASS_TEN_RATE = 0.099;
  disDefs[disCodes.DIS_DAY_PASS_TEN] = {
    type: disTypes.DISTYPE_ALL_TRIP,
    name: 'day-pass-10-1',
    default: true,
    getPassDiscount: (fare) => fare * DIS_DAY_PASS_TEN_RATE
  };
  
/* 
  // now 3.8% after fare adjustment
  const DIS_CEIL_FIVE_RATE = 0.05;
  disDefs[disCodes.DIS_CEIL_FIVE] = {
    type: disTypes.DISTYPE_ALL_TRIP,
    name: 'discount-5pc',
    default: true,
    getDiscount: discount_ceiling(DIS_CEIL_FIVE_RATE)
  };
*/

  const DIS_CEIL_FIVE_RATE_2 = 0.038;
  disDefs[disCodes.DIS_CEIL_FIVE_2] = {
    type: disTypes.DISTYPE_ALL_TRIP,
    name: 'discount-5pc-2',
    default: true,
    getDiscount: discount_ceiling(DIS_CEIL_FIVE_RATE_2)
  };
    
  disDefs[disCodes.DIS_MINUS_TWO] = {
    type: disTypes.DISTYPE_PER_TRIP,
    name: 'fare-saver',
    default: false,
    getDiscount: (fare, info) => info.isFirst?2:0
  };
  
  // needed this when there is a % discount
  disDefs[disCodes.DIS_SHOW_TRANSIT] = {
    type: disTypes.DISTYPE_NON_TRIP,
    name: 'transit-choice',
    default: true,
  }
  
  app.DISDEF = {
    types: disTypes,
    codes: disCodes,
    defs:  disDefs
  };
  
}(window.MTRDP));
