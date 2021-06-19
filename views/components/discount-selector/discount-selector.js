// discount (per-trip) selection tools
(function(app) {
  
  let sid = 0;
  let selectors = [];
  
  // (pre-)initialize view
  const init = async () => {
    await app.loadAll([
      'views/components/discount-selector/discount-selector.css',
      'CONF',
      'DIS',
      'DOM',
    ]);
  };
  
  // static function : reset all selectors
  const resetAll = () => {
    if(selectors) {
      selectors.forEach(function(selector) {
        if(selector) {
          selector.reset();
        }
      })
    }
  };
  
  // discount selector class (constructor)
  // values: key-value paid of items selected
  function DiscountSelector(values) {
    
    const elements = [];
    const options = [];
    if(!values) values = {};
     
    for(const disCode in app.DIS.discounts) {
      if(app.DIS.discounts.hasOwnProperty(disCode)) {
        const disdef = app.DIS.discounts[disCode];
        if(!app.DIS.isGlobal(disdef)) {
          const disoptID = 'disopt-'+sid+'-'+disCode; // unique code
          const optElement = app.DOM.create('input', { id: disoptID, type: 'checkbox', value: disCode });
          if(values.hasOwnProperty(disCode)) {
            optElement.checked = true;
          }
          optElement.addEventListener('change', this.changed.bind(this));
          options.push(optElement);
          
          elements.push(app.DOM.create('div', { className: 'discount-selector-option' }, [
            optElement, 
            app.DOM.create('label', { for: disoptID }, [ app.LANG.create(disdef.name, 'discount') ])
          ]));
        }
      }
    }
    
    this.elem = app.DOM.create('div', { className: 'discount-selector' }, elements);
        
    this.listeners = [];
    this.options = options;
    
    selectors.push(this);
    
    // increment sid
    sid++;
  };
  
  // attach selector to a container and the corresponding listener
  // container: container of the selector
  // listener: called when option changed
  DiscountSelector.prototype.attach = function(container, listener) {   
    container.appendChild(this.elem);
    this.addListener(listener);
  };
  
  // add listener for the event of option changed
  DiscountSelector.prototype.addListener = function(listener) {
    this.listeners.push(listener);
  }
  
  // manually update selected values
  DiscountSelector.prototype.select = function(values) {
    this.options.forEach((opt) => {
      opt.checked = (values.hasOwnProperty(opt.value)?values[opt.value]:false);
    });
    this.changed();
  };
  
  // option changed, notify everyone
  DiscountSelector.prototype.changed = function() {
    this.listeners.forEach((listener) => {
      listener(this.getValues()); 
    });
  };
  
  // get values
  DiscountSelector.prototype.getValues = function() {
    const values = {};
    this.options.forEach((opt) => {
      values[opt.value] = opt.checked;
    });
    return values;
  };
  
  // free up resources by removing it from selector list
  DiscountSelector.prototype.free = function() {
    const index = selectors.indexOf(this);
    if(index >= 0) {
      selectors.splice(index, 1);
    }
  };
  
  // inject to app
  DiscountSelector.init = init;
  app.DiscountSelector = DiscountSelector;
  
})(window.MTRDP);
