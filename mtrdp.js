// Core App object
window.MTRDP = {};

((app) => {

  // list of objects loadable to app
  const modules = {
    CONF: 'config/data.js',
    DISDEF: 'config/discounts.js',
    STR: 'config/strings.js',
    
    DATA: 'lib/data.js',
    DIS: 'lib/discounts.js',
    LANG: 'lib/lang.js',
    OPT: 'lib/options.js',
    STATE: 'lib/state.js',
    DOM: 'lib/dom.js',
    MAPSLINK: 'lib/mapslink.js',
    
    LINES: 'models/lines.js',
    FARES: 'models/fares.js',
    
    VIEW: 'views/view.js',
    StationSelector: 'views/components/station-selector/station-selector.js',
    DiscountSelector: 'views/components/discount-selector/discount-selector.js',
    TripWidget: 'views/components/trip-widget/trip-widget.js',
  };
  
  // record scripts to be loaded, notify if needed
  const scripts = {};
  
  // import JS/CSS file
  app.load = async (item) => {
    // could load URL or module
    let url, obj;
    if(modules.hasOwnProperty(item)) {
      url = modules[item];
      obj = item;
    } else {
      url = item;
      obj = null;
    }
  
    if(!scripts.hasOwnProperty(url)) {
      scripts[url] = {
        loaded: false,
        resolves: []
      };
      
      await new Promise((resolve) => { 
        scripts[url].resolves.push(resolve);
        if(/\.js$/.test(url)) {
          const script = document.createElement('script');
          script.type = 'text/javascript';
          if(script.readyState) {
            script.onreadystatechange = () => {
              if(script.readyState === 'loaded' || script.readyState === 'complete') {
                script.onreadystatechange = null;
                resolveAll(url);
              }
            }
          } else {
            script.onload = () => { 
              // if loading a module, run init() if available
              if(obj === null || !app[obj].hasOwnProperty('init')) {
                resolveAll(url); 
              } else {
                app[obj].init().then(()=>{resolveAll(url)});
              }
            };
          }
          script.src = url;
          document.getElementsByTagName('head')[0].appendChild(script);
        } else if(/\.css$/.test(url)) {
          const link = document.createElement('link');
          link.type = 'text/css';
          link.rel = 'stylesheet';
          link.onload = () => { resolveAll(url); }
          link.href = url;
          document.getElementsByTagName('head')[0].appendChild(link);
        } else {
          // do nothing
          resolveAll(url);
        }
      });
      
    } else {
      // wait for the real promise to finish if already exists
      await new Promise((resolve) => {
        if(!scripts[url].loaded) {
          scripts[url].resolves.push(resolve);
        } else {
          // alread loaded
          resolve();
        }
      });
    }
  };
  
  // wrapper that load multiple urls
  app.loadAll = async (urls) => {
    await Promise.all(urls.map((url) => app.load(url)));
  };
  
  // resolve all script promises 
  const resolveAll = (url) => {
    if(scripts.hasOwnProperty(url) && !scripts[url].loaded) {
      scripts[url].loaded = true;
      scripts[url].resolves.forEach((resolve) => { resolve(); });
    }
  };
  
  // initialize App
  // first load config and constants, then import module
  const initApp = async () => {    
    await app.load('VIEW');
    app.VIEW.hideLoading();
  }  
  
  initApp();
  
})(window.MTRDP);
