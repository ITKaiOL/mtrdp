// Core App object
window.MTRDP = {
  config: {},        // configuarations
  languages: [],     // language options
  strings: {},       // string literals
  names: {},         // names (lines and stations)
  lines: {},         // lines and stations  
  fares: [],         // fares between two stations
  fareDistances: [], // distance between two stations by minimum travelling fares
  minFare: Infinity, // minimum fare
  sections: {},      // available sections
};

(function(app) {
  
  const scripts = {};
  
  // import JS/CSS file
  // async
  app.load = function(url) {
    if(!scripts.hasOwnProperty(url)) {
      scripts[url] = {
        loaded: false,
        resolves: []
      };
      
      return new Promise(function(resolve) { 
        scripts[url].resolves.push(resolve);
        if(/\.js$/.test(url)) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          if(script.readyState) {
            script.onreadystatechange = function() {
              if(script.readyState === 'loaded' || script.readyState === 'complete') {
                script.onreadystatechange = null;
                resolveAll(url);
              }
            }
          } else {
            script.onload = function() { resolveAll(url); }
          }
          script.src = url;
          document.getElementsByTagName('head')[0].appendChild(script);
        } else if(/\.css$/.test(url)) {
          const link = document.createElement('link');
          link.type = 'text/css';
          link.rel = 'stylesheet';
          link.onload = function() { resolveAll(url); }
          link.href = url;
          document.getElementsByTagName('head')[0].appendChild(link);
        } else {
          // do nothing
          resolveAll(url);
        }
      });
      
    } else {
      // wait for the real promise to finish if already exists
      return new Promise(function(resolve) {
        if(!scripts[url].loaded) {
          scripts[url].resolves.push(resolve);
        } else {
          // alread loaded
          resolve();
        }
      });
    }
  };
  
  // resolve all script promises 
  function resolveAll(url) {
    if(scripts.hasOwnProperty(url) && !scripts[url].loaded) {
      scripts[url].loaded = true;
      scripts[url].resolves.forEach(function(resolve) { resolve(); });
    }
  }
  
  
  // initialize App
  // first load config and constants, then import module
  function initApp() {    
    loadConfig().then(loadMain).then();
  }
  // load configurations and utilities
  // async
  function loadConfig() {
    return Promise.all([
          app.load('lib/config/config.js'),
          app.load('lib/config/strings.js'),
          app.load('lib/util.js'),
        ]);
  }
  
  var loadingFlag = true;
  // load main sources
  // async
  function loadMain() {
    return Promise.all([
      app.load('lib/data-loader.js').then(function() { app.model.init(); }),
      app.load('lib/view-loader.js').then(function() { app.view.init(); }),
      new Promise(function(resolve) {  // forced loading screen for no reason :P
        setTimeout(swapMessage, 250);
        setTimeout(function() { 
          loadingFlag = false; 
          resolve();
        }, 3000+Math.random()*5000);
      }),
    ]).then(hideLoading);
  }
  
  // wrapper function to hide loading screen
  function hideLoading() {
    app.view.hideLoading();
  }
  
  // random message...
  var messages = [
    '不如搭巴士? How about bus?',
    '你仲出街? Stay home!',
    '望咩呀望? Nothing to see here.',
    '搭巴士唔好咩? Why not bus?',
    '走啦! Go away!',
    '搭巴士啦! Take a bus!',
    '啊~~~~~~ Ah~~~~~~~~',
    '你個嘢壞咗呀! You are broken!',
  ];
  var currMsg = null;
  function swapMessage() {
    if(currMsg === null) {
      currMsg = Math.floor(Math.random()*messages.length);
    }
    setTimeout(_swapMessage, 1000+Math.random()*1000);  
  }
  function _swapMessage() {
    if(loadingFlag) {
      document.getElementById('loading-msg').textContent = messages[currMsg];
      currMsg = (currMsg+1)%messages.length;
      swapMessage();
    }
  }
  
  initApp();
  
})(window.MTRDP);
