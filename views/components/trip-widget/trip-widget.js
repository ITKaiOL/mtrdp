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
      if(leg.usePass) {
        classNames.push('use-pass')
      }
      elements.push(app.DOM.create('div', { className: classNames.join(' ') }, [
        app.LANG.create(leg.from, 'mtr'),
        '➔',
        app.LANG.create(leg.to, 'mtr'),
      ]));
    });
    return elements;
  };
  
  app.TripWidget = {
    init: init,
    create: tWidgetCreate
  };
  
})(window.MTRDP);
