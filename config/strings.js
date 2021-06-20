// defined strings
(function(app) {

  const langEN = {
    'discount': {
      'early-bird': 'Early Bird (end of journey)(35%)',
      'early-bird-tst': 'Early Bird (b/f TST interchange)',
      'early-bird-dp': 'Early Bird (b/f using day pass)',
      'discount-5pc': '5% Fare Savings',
      'fare-saver': 'Fare Saver ($2)',
      'day-pass-10-1': 'Day pass: Return 10 get 1 free',
      'transit-choice': 'Consider TST/E.TST transit'
    },
    'mtr': {
      WRL: 'West Rail Line',
      TWL: 'Tseun Wan Line',
      KTL: 'Kwun Tong Line',
      ISL: 'Island Line',
      EAL: 'East Rail Line',
      TML: 'Tuen Ma Line',
      TKL: 'Tseung Kwan O Line',
      TCL: 'Tung Chung Line',
      DRL: 'Disney Resort Line',
      SIL: 'South Island Line',
    }
  };
  
  const langZH = {
    'discount': {
      'Inbound': '回程',
      'Outbound': '去程',
      'Day Pass': '全日通',
      'early-bird': '早晨折扣 (尾程)(六五折)',
      'early-bird-tst': '早晨折扣 (尖沙咀站轉乘前)',
      'early-bird-dp': '早晨折扣 (轉用全日通前)',
      'discount-5pc': '節省車費 5%',
      'fare-saver': '港鐵特惠站 ($2)',
      'day-pass-10-1': '全日通: 十換一優惠',
      'transit-choice': '考慮尖沙咀/尖東站轉乘'
    },
    'title': {
      'Day-pass Analyser': '全日通優惠分析',
      'Round-trip overview': '即日來回總覽',
      'Route planner': '計劃行程',
      'Data date': '資料日期',
      'Info': '相關資料'
    },
    'mtr': {
      'Select station': '選擇車站',
      'From': '由',
      'To': '到',
      WRL: '西鐵線',
      TWL: '荃灣線',
      KTL: '觀塘線',
      ISL: '港島線',
      EAL: '東鐵線',
      TML: '屯馬線',
      TKL: '將軍澳線',
      TCL: '東涌線',
      DRL: '迪士尼線',
      SIL: '南港島線',
    },
    'overview': {
      'Option': '選項',
    },
    'planner': {
      'Reset all': '重新開始',
      'Option': '選項',
      'Day pass not applicable': '全日通不適用',
      'Using day pass': '使用全日通',
      'Without day pass': '不使用',
    },
  };
  
  app.STR = {
    en: langEN,
    zh: langZH
  };
  
}(window.MTRDP));