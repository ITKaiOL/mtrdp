// Google Maps link utilities
(function(app) {
  
  const baseURL = 'https://www.google.com/maps/dir/';
  const defaultParams = {
    api: 1,
    travelmode: 'transit'
  };
  
  // build encoded params for maps URL
  const buildParam = (option) => {
    const param = Object.assign(defaultParams, option);
    const paramStr = [];
    for(const key in param) {
      if(param.hasOwnProperty(key)) {
        paramStr.push(encodeURIComponent(key) + '=' + encodeURIComponent(param[key]));
      }
    }
    return paramStr.join('&');
  };
  
  const getLink = (source, destination) => {
    return baseURL+'?'+buildParam({source: source, destination: destination});
  };
  
  app.MAPSLINK = {
    get: getLink
  };
  
}(window.MTRDP));
