// maintain names and strings used in the app
(function(app) {
  
  app.strings = {
    'title'              : { zh: '全日通優惠分析'   , en: 'Day-pass Analyser'},
    'data-time'          : { zh: '資料取得日期: '   , en: 'Data retrival date: '},
    'round-trip'         : { zh: '即日來回總覽'     , en: 'Same day return overview'},
    'route-planner'      : { zh: '計劃行程'         , en: 'Route planning'},
    'discount20'         : { zh: '八折優惠'         , en: '20% off'},
    'daypass-10for1'     : { zh: '全日通十送一'     , en: 'Day pass 10 for 1'},
    'early-bird'         : { zh: '早鳥優惠(65折)'   , en: 'Early-bird (35% off)'},
    'nil-trip'           : { zh: '沒有'            , en: 'None'},
    'fwd-trip'           : { zh: '去程'            , en: 'Outbound'},
    'bak-trip'           : { zh: '回程'            , en: 'Inbound'},
    'rnd-trip'           : { zh: '來回'            , en: 'Both trips'},
    'select-station'     : { zh: '揀車站'          , en: 'Pick a station'},
    'daypass'            : { zh: '全日通'          , en: 'Day pass'},
    'octopus'            : { zh: '八達通'          , en: 'Octopus'},
    'via-3/80'           : { zh: '經尖沙咀/尖東'    , en: 'via TST/E.TST'},
    'via-80/3'           : { zh: '經尖東/尖沙咀'    , en: 'via E.TST/TST'},
    '(dayPass)'          : { zh: '(全日通)'        , en: '(day pass)'},
    '(octopus)'          : { zh: '(八達通)'        , en: '(octopus)'},
    'reset-all'          : { zh: '重新開始'        , en: 'Reset all'},
    'from-station'       : { zh: '由'              , en: 'From'},
    'to-station'         : { zh: '到'              , en: 'To'},
    'daypass-nouse'      : { zh: '全日通不適用'     , en: 'Do not use day pass'},
    'daypass-total'      : { zh: '使用全日通:'      , en: 'Using day pass:'},
    'not-use'            : { zh: '不使用:'          , en: 'Not using:'},
    'buy-daypass'        : { zh: '用全日通!!'       , en: 'Use a day pass!!'},
  };
  
  // line names
  app.names.lines = {
      WRL: { zh:'西鐵線',   en: 'West Rail Line' },
      TWL: { zh:'荃灣線',   en: 'Tseun Wan Line' },
      KTL: { zh:'觀塘線',   en: 'Kwun Tong Line' },
      ISL: { zh:'港島線',   en: 'Island Line' },
      EAL: { zh:'東鐵線',   en: 'East Rail Line' },
      TML: { zh:'屯馬線',   en: 'Tuen Ma Line' },
      TKL: { zh:'將軍澳線', en: 'Tseung Kwan O Line' },
      TCL: { zh:'東涌線',   en: 'Tung Chung Line' },
      DRL: { zh:'迪士尼線', en: 'Disney Resort Line' },
      SIL: { zh:'南港島線', en: 'South Island Line' },
  };
  
})(window.MTRDP);
