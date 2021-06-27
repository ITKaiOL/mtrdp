// normalized trip display tools
(function(app) {
  
  // (pre-)initialize view
  const init = async () => {
    await app.loadAll([
      'views/components/trip-widget/trip-widget.css',
      'DOM',
      'LANG'
    ]);
  };
  
  const tWidgetCreate = (itin) => {
    const elements = [];
    itin.forEach(leg => {
      const classNames = ['tWidget-trip-leg'];
      let contents = [
        app.LANG.create(leg.from, 'mtr'),
        '➔',
        app.LANG.create(leg.to, 'mtr'),
      ];
      
      if(leg.usePass) {
        classNames.push('use-pass')
      }
      
      if(leg.hasOwnProperty('link')) {
        classNames.push('link');
        contents = [app.DOM.link(leg.link, contents, true)];
      }
      
      const div = app.DOM.create('div', { className: classNames.join(' ') }, contents);
      elements.push(div);
      
      if(leg.hasOwnProperty('link')) {
        div.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          window.open(leg.link);
        });
      }
      
    });
    return elements;
  };
  
  app.TripWidget = {
    init: init,
    create: tWidgetCreate
  };
  
})(window.MTRDP);
