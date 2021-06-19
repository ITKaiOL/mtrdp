// data loader
(function(app) {
  
  // cache data
  const cache = {
    
  };
  
  // Simple AJAX CSV Loader
  const loadCSV = async (url) => {
    if(cache.hasOwnProperty(url)) {
      return cache[url];
    }
    
    cache[url] = await new Promise(function(resolve) {
      
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        // fix quoted values and trim spaces
        function trimQuotes(value) {
          value = value.trim();
          return (/^".*"$/.test(value))?value.slice(1,-1):value;
        }
        // split row into columns and trim their quotes
        function splitDataRow(row) {
          return row.split(',').map(trimQuotes);
        }
        if(xhr.readyState === XMLHttpRequest.DONE) {
          
          const csvLines = xhr.responseText.split("\n").map(splitDataRow);
          
          // extract header
          const headers = csvLines.shift();
          // merge header and date
          const data = csvLines.map(function(record) {
            return Object.fromEntries(headers.map(function(key, index) { return [key, record[index]]; }));
          });

          resolve(data);
        }
      };
      xhr.open('GET', url, true);
      xhr.send();
    });
    
    return cache[url];
  }

  app.DATA = {
    loadCSV: loadCSV
  };
  
}(window.MTRDP));
