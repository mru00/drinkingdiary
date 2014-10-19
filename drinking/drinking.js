'use strict';

/*
* Copyright (C) 2014 mru@sisyphus.teil.cc
*/

function formatDate(date) {
  console.assert(date != null);
  var day = ("0" + date.getDate()).slice(-2);
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  return date.getFullYear()+"-"+(month)+"-"+(day) ;
}
String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {
    var reg = new RegExp("\\{" + i + "\\}", "gm");
    s = s.replace(reg, arguments[i + 1]);
  }
  return s;
}
function previousDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()-1);
}

// Get the ISO week date week number
Date.prototype.getWeek = function () {
  // Create a copy of this date object
  var target  = new Date(this.valueOf());

  // ISO week date weeks start on monday
  // so correct the day number
  var dayNr   = (this.getDay() + 6) % 7;

  // ISO 8601 states that week 1 is the week
  // with the first thursday of that year.
  // Set the target date to the thursday in the target week
  target.setDate(target.getDate() - dayNr + 3);

  // Store the millisecond value of the target date
  var firstThursday = target.valueOf();

  // Set the target to the first thursday of the year
  // First set the target to january first
  target.setMonth(0, 1);
  // Not a thursday? Correct the date to the next thursday
  if (target.getDay() != 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }

  // The weeknumber is the number of weeks between the 
  // first thursday of the year and the thursday in the target week
  return 1 + Math.ceil((firstThursday - target) / 604800000); 
  // 604800000 = 7 * 24 * 3600 * 1000
}



var loading_counter = 0;
function start_loading_animation() {
  var lc1 = loading_counter;
  if (loading_counter == 0 ) {
    $.mobile.loading('show');
  }
  loading_counter ++;
  console.assert(loading_counter == lc1 + 1);
}
function end_loading_animation() {
  var lc1 = loading_counter;
  if (loading_counter > 0 ) {
    loading_counter --;
    if (loading_counter == 0 ) {
      $.mobile.loading('hide');
    }
  }
  console.assert(loading_counter == lc1 - 1);
}



var last_error = null;
function promiseErrorHandler(msg) {
  return function(a, e) {
    if (a == null) a = { message: "unknown" };
    if (typeof a.message != "string") a.message= "unknown";
    console.log(msg + ": Action error: " + a.message, a, e);
    last_error = msg + ": " + a.message;
    $.mobile.changePage('#page-show-error');
  }
}


var DB_NAME = "drinks_dev_3";
var STORE_NAME_DRINKS = "drink";
var STORE_NAME_SERVINGS = "serving";
var STORE_NAME_CONSUMPTIONS = "consumption";
var ALL_STORES = [ STORE_NAME_DRINKS, STORE_NAME_SERVINGS, STORE_NAME_CONSUMPTIONS ];
var RO = "readonly";
var RW = "readwrite";




function Page(selector, props) {
  var self = this;
  this.value = null;
  this.selector = selector;

  $.extend(this, props, {
    onbutton: function(button_selector, handler) {
      self.jq().find(button_selector).click(self.handle(handler));
    },

    jq: function() { return $(selector); },
    find: function() {
      var s1 = self.jq();
      var result = s1.find.apply(s1, arguments);
      console.assert (result.length ==1 );
      return result;
    },
    handle: function(handler_fn) {
      // mediator to get 'this' correctly in handler functions
      // $('...').click(page_obj.handle(page_obj.callback))
      return function() {
        return handler_fn.call(self, arguments);
      }
    },
    show_: function() {
      this.show();
    },
    oncreate_: function() {
      if (typeof this.oncreate != "undefined") {
        this.oncreate();
      }
    },
    hide_: function() {
      var page = self.jq();
      self.value = null;
      self.hide();
      //page.find('.btn-delete').hide();
    }

  });

  $(function() {
    var page = self.jq();
    page.on("pagebeforeshow", self.handle(self.show_));
    page.on("pagehide", self.handle(self.hide_));
    page.data('page_obj', self);

    // on document ready... oncreate for this page
    self.oncreate_();
    //page.find('.btn-delete').hide();
  });
}

//
//
// diagnostic promise handler
function _(promise, title){
  if (title == null) title = "unknown";
  start_loading_animation();
  promise.then(function(a, e){
    console.log("Action completed done", e.type, a, e);
    end_loading_animation();
  }, function(a, e){
    promiseErrorHandler(title)(a,e);
    end_loading_animation();
  }, function(a, e){
    console.log("Action completed progress", a, e);
    end_loading_animation();
  });
}



function getdb() { return $.indexedDB(DB_NAME); };
function opendb() {

  // return the promise
  //
  return $.indexedDB(DB_NAME, {
    "schema": {
      "1": function(transaction) {
        var store_servings = transaction.createObjectStore(STORE_NAME_SERVINGS, {keyPath: "name"});
        var store_drinks = transaction.createObjectStore(STORE_NAME_DRINKS, {keyPath: "name"});
        var store_consumptions = transaction.createObjectStore(STORE_NAME_CONSUMPTIONS, {keyPath: "date"});

        [ {name:"Halbe", liter: 0.5},
          {name:"Seiterl", liter: 0.3},
          {name:"1/4erl", liter: 0.25},
          {name:"1/8erl", liter: 0.125},
          {name:"2cl", liter: 0.02},
          {name:"4cl", liter: 0.04},
          {name:"Flasche (0.75)", liter: 0.75}
        ].forEach(function (d) {

          store_servings.add(d);
        });

        [ {name:"Bier", calories:100, alc:5, servings:["Halbe", "Seiterl"]},
          {name:"Wein", calories:100, alc:9, servings:["1/8erl"]},
          {name:"Spritzer", calories: 100, alc:4, servings:["1/4erl", "Halbe"]},
          {name:"Sekt", calories: 100, alc:4, servings:["1/8erl", "Flasche (0.75)"]}
        ].forEach(function (d) {

          store_drinks.add(d);
        });

      },
    }
  });
}


$(function() {

  start_loading_animation();

  $('.btn-add, .btn-save, .btn-delete, .btn-cancel, .btn-back').addClass('btn btn-icon-left');
  $('.btn-edit').addClass('btn btn-icon-right');

  $('.btn').addClass('ui-btn');
  $('.btn-icon-left').addClass('ui-btn-icon-left');
  $('.btn-icon-right').addClass('ui-btn-icon-right');


  $('.btn-edit').addClass('ui-icon-edit');
  $('.btn-add').addClass('ui-icon-plus');
  $('.btn-save').addClass('ui-icon-check ui-btn-inline');
  $('.btn-delete').addClass('ui-icon-delete ui-btn-inline');
  $('.btn-cancel').addClass('ui-icon-back ui-btn-inline');
  $('.btn-back').addClass('ui-icon-back ui-btn-b');


  $('.ui-btn').addClass('ui-shadow ui-corner-all');

  $('.develop').each(function() {
    var selector = 'a[href="#'+ $(this).attr('id')+'"]';
    $(selector).hide();
  });


  opendb().then(function() {
    if ($.mobile.activePage.attr('id') == 'page-main') {
      page_main.show();
    }
    end_loading_animation();
  }, promiseErrorHandler("open db"));


});


$(document).on('pagebeforecreate', '', function (event) {
  var copy = 'Copyright &copy; 2014 <a href="mailto:mru@sisyphus.teil.cc">mru@sisyphus.teil.cc</a>';
  $(event.target).append('<div data-role="footer" style="text-align: center"><small>'+copy+'</small></div>')
});











function createConsumptionHTML(value) {
  var now = new Date();
  var today = formatDate(now);
  var yesterday = formatDate(previousDay(now));
  var is_today = value.date == today;
  var is_yesterday = value.date == yesterday;
  return $(String.format('<li><a href="#page-consumption-details" class="btn-edit ui-btn ui-btn-icon-right ui-icon-edit">{0}{2}: {1}</a></li>',
                         value.date,
                         value.drinks
                         .map(function(drink) {return String.format("{0} {1} {2}", drink.amount, drink.servings, drink.drink); })
                         .join(', '),
                         is_today ? " (today)" : is_yesterday ? " (yesterday)" : ""
                        ));
}
var page_main = new Page("#page-main", {

  oncreate: function() {
    this.onbutton('.btn-insert-base-data', this.insert_base_data);
  },
  show: function() {
    start_loading_animation();
    var target_ul = this.find('.field-list');

    var now = new Date();
    var today = formatDate(now);
    var yesterday = formatDate(previousDay(now));

    // XXX intentinally no error handling here. bad, but better than
    // endless error->main->error loops.
    getdb().objectStore(STORE_NAME_CONSUMPTIONS).get(yesterday).then(function(value) {
      if (value != null) {
        var elem = createConsumptionHTML(value);
        target_ul.append(elem);
        elem.click(function() { page_consumption_details.value = yesterday; });
      }

      return getdb().objectStore(STORE_NAME_CONSUMPTIONS).get(today)

    }).then(function(value) {
      if (value != null) {
        var elem = createConsumptionHTML(value);
        target_ul.append(elem);
        elem.click(function() { page_consumption_details.value = today; });
      }
      end_loading_animation();
    });
  },
  hide : function() { 
    this.find('.field-list').empty();
  }
});








var page_consumptions = new Page("#page-consumptions", {
  show : function() {
    var target_ul = this.find('.field-list');

    _(getdb().objectStore(STORE_NAME_CONSUMPTIONS).each(function(item) {
      var value = item.value;
      var elem = createConsumptionHTML(value);
      target_ul.append(elem);
      elem.click(function() { page_consumption_details.value = item.key; });
    }), "list consumptions");
  },
  hide : function() {
    this.find('.field-list').empty();
  }
});






function populateOptions(collection, accessor, selected, target) {
  collection.forEach(function(item) {
    var elem = $( String.format('<option value="{0}">{1}</option>', encodeURI(accessor(item)), accessor(item)) );
    target.append( elem );
    if (selected != null && accessor(item) == selected) {
      elem.attr('selected',"selected").trigger('change');
    }
  });
}

function getRange(n) {
  return Array(n).join().split(',').map(function(e, i) { return i+1; });
}  

function addConsumptionEntry(drinks, servings, value) {

  var div = $('#consume-entries');

  var fs = $('<fieldset data-role="controlgroup" data-type="horizontal"></fieldset>');
  //div.append(fs);

  var select_amount = $('<select name="amount" data-iconpos="noicon">');
  var select_serv = $('<select name="serving" data-iconpos="noicon">');
  var select_drink = $('<select name="drink" data-iconpos="noicon">');


  select_serv.append( $( '<option value=""></option>' ) );
  select_drink.append( $( '<option value=""></option>' ) );

  populateOptions(getRange(20), 
                  function(i) { return i },
                  value == null ? null : value.amount,
                  select_amount);

  populateOptions(servings, 
                  function(i) { return i.value.name }, 
                  value == null ? null : value.servings,
                  select_serv);

  populateOptions(drinks, 
                  function(i) { return i.value.name }, 
                  value == null ? null : value.drink,
                  select_drink);


  var delete_entry = $('<button title="remove entry" data-inline="true" class="ui-btn ui-icon-delete ui-btn-icon-right">&nbsp;</button>');
  delete_entry.on('click', function() { fs.remove(); });

  fs.append(select_amount).trigger('create');
  fs.append(select_serv).trigger('create');
  fs.append(select_drink).trigger('create');
  fs.append(delete_entry).trigger('create');
  div.append(fs).trigger('create');
}


var page_consumption_details = new Page("#page-consumption-details", {

  show: function() {
    var today;
    if (this.value == null) {
      today = formatDate(new Date());
    }
    else {
      today = this.value;
    }

    start_loading_animation();
    var self = this;
    var input_date = this.find('.field-date');

    self.drinks = [];
    self.servings = [];

    getdb().transaction([STORE_NAME_DRINKS, STORE_NAME_SERVINGS, STORE_NAME_CONSUMPTIONS]).then( function() {
      end_loading_animation();
    }, 
    promiseErrorHandler("get all consumptions"), 
    function(trans) {

      trans.objectStore(STORE_NAME_DRINKS).each(function(value) {
        self.drinks.push(value);
      }).then(function() {
        return trans.objectStore(STORE_NAME_SERVINGS).each(function(value) {
          self.servings.push(value);
        })
      }).then(function() {

        return trans.objectStore(STORE_NAME_CONSUMPTIONS).get(today);

      }).then(function(value) {

        if (value) {
          self.find('.field-date').val(value.date);
          value.drinks.forEach(function (d) { addConsumptionEntry(self.drinks, self.servings, d); });
          self.find('.btn-delete').show();
        } 
        else {
          input_date.val(today);
          addConsumptionEntry(self.drinks, self.servings);
        }
      }).fail(promiseErrorHandler("get consumption"));

    });

  },
  hide : function() {
    this.value = null;
    this.find('#consume-entries').empty(); 
    this.find('.field-date').val("");
  },
  save : function() {

    var fs = $('#consume-entries fieldset');

    var drinks = [];
    fs.each(function(idx, elem) {
      drinks.push( {
        "amount":$( this ).find ('select[name="amount"]').val(),
        "drink":decodeURI($( this ).find ('select[name="drink"]').val()),
        "servings":decodeURI($( this ).find ('select[name="serving"]').val())
      });
    });

    var value = {"date": this.find('.field-date').val(), "drinks": drinks };
    getdb().objectStore(STORE_NAME_CONSUMPTIONS).put(value).then( function() {
      $.mobile.changePage('#page-main');
    }, promiseErrorHandler("save consumption"));
  },
  drop : function() {
    getdb().objectStore(STORE_NAME_CONSUMPTIONS)['delete'](this.find('.field-date').val()).then(function() {
      $.mobile.changePage('#page-main');
    }, promiseErrorHandler("delete consumption"));
  },
  cancel : function() {
    $.mobile.changePage('#page-main');
  },
  add_entry: function() {
    addConsumptionEntry(this.drinks, this.servings);
  },
  oncreate: function() {
    this.onbutton('.btn-add', this.add_entry);
    this.onbutton('.btn-save', this.save);
    this.onbutton('.btn-delete', this.drop);
    this.onbutton('.btn-cancel', this.cancel);
  }
});















function createDrinkHTML(value) {
  return $('<li><a href="#page-drink-details" class="btn-edit ui-btn ui-btn-icon-right ui-icon-edit">'+value.name+'</a></li>');
}
var page_drinks = new Page("#page-drinks", {

  show : function() {
    var target_ul = this.find('.field-drinks');

    _(getdb().objectStore(STORE_NAME_DRINKS).each(function (item) {
      var elem = createDrinkHTML(item.value);
      target_ul.append(elem);
      elem.click(function() { page_drink_details.value = item.value });
    }), "each drink");
  },
  hide : function() {
    this.find('.field-drinks').empty();
  }

});






var page_drink_details = new Page("#page-drink-details", {
  show : function() {
    if (this.value != null) {
      this.find('.field-name').val(this.value.name);
      this.find('.field-alc').val(this.value.alc);
      this.find('.field-calories').val(this.value.calories);
      this.find('.btn-delete').show()
    }
  },
  hide : function() {
    this.find('.field-name').val('');
    this.find('.field-alc').val('');
    this.find('.field-calories').val('');
  },
  save : function() {
    var value = {
      'name': this.find('.field-name').val(),
      'alc': this.find('.field-alc').val(),
      'calories': this.find('.field-calories').val()
    };
    getdb().objectStore(STORE_NAME_DRINKS).put(value).then(function() {
      $.mobile.changePage('#page-drinks');
    }, promiseErrorHandler("save drink"));
  },
  validate : function() {
  },
  drop : function() {
    var key = this.find('.field-name').val();
    getdb().objectStore(STORE_NAME_DRINKS)['delete'](key).then(function() {
      $.mobile.changePage('#page-drinks');
    }, promiseErrorHandler("delete drink"));
  },
  oncreate: function() {
    this.onbutton('.btn-save', this.save);
    this.onbutton('.btn-delete', this.drop);
  }

});







function createServingHTML(value) {
  return $(String.format('<li><a href="#page-serving-details" class="btn-edit btn ui-btn ui-btn-icon-right ui-icon-edit">{0} -- {1}l</a></li>', 
                         value.name, 
                         value.liter));
}
var page_servings = new Page("#page-servings", {
  show : function() {
    var target_ul = this.find('.field-servings');

    _(getdb().objectStore(STORE_NAME_SERVINGS).each(function(item) {
      var value = item.value;
      var elem = createServingHTML(item.value);
      target_ul.append(elem);
      elem.click(function() { page_serving_details.value = value; });
    }), "each serving");
  },
  hide : function() { 
    this.find('.field-servings').empty();
  }

});




var page_serving_details = new Page("#page-serving-details", {

  show : function () {
    if (this.value != null) {
      this.find(".field-name").val(this.value.name);
      this.find(".field-liters").val(this.value.liter);
      this.find('.btn-delete').show();
    }
  },
  hide : function () {
    this.find('.field-name').val('');
    this.find('.field-liters').val('');
  },
  save : function() {
    var value = {
      'name': this.find('.field-name').val(),
      'liter': this.find('.field-liters').val(),
    };
    getdb().objectStore(STORE_NAME_SERVINGS).put(value).then(function() {
      $.mobile.changePage('#page-servings');
    }, promiseErrorHandler("save serving"));
  },
  drop : function() {
    var key = this.find('.field-name').val();
    getdb().objectStore(STORE_NAME_SERVINGS)['delete'](key).then(function() {
      $.mobile.changePage('#page-servings');
    }, promiseErrorHandler("delete serving"));
  },

  oncreate: function() {
    this.onbutton('.btn-save', this.save);
    this.onbutton('.btn-delete', this.drop);
  }



});




var page_show_error = new Page("#page-show-error", {
  show : function () {
    if (last_error != null)
      this.find(".field-error").val(last_error);
  },
  hide : function () {
    this.find('.field-error').val('');
  }
});





function utf8_to_b64( str ) {
    return window.btoa(encodeURIComponent( escape( str )));
}

function b64_to_utf8( str ) {
    return unescape(decodeURIComponent(window.atob( str )));
}


// required to send email (follow 'href="mailto:"' link) programatically on a button.click event
/**
 * Fire an event handler to the specified node. Event handlers can detect that the event was fired programatically
 * by testing for a 'synthetic=true' property on the event object
 * @param {HTMLNode} node The node to fire the event handler on.
 * @param {String} eventName The name of the event without the "on" (e.g., "focus")
 */
function fireEvent(node, eventName) {
  // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
  var doc;
  if (node.ownerDocument) {
    doc = node.ownerDocument;
  } else if (node.nodeType == 9 /** DOCUMENT_NODE */){
    // the node may be the document itself
    doc = node;
  } else {
    throw new Error("Invalid node passed to fireEvent: " + +node.tagName + "#" + node.id);
  }

  if (node.fireEvent) {
    // IE-style
    var event = doc.createEventObject();
    event.synthetic = true; // allow detection of synthetic events
    node.fireEvent("on" + eventName, event);
  } else if (node.dispatchEvent) {
    // Gecko-style approach is much more difficult.
    var eventClass = "";

    // Different events have different event classes.
    // If this switch statement can't map an eventName to an eventClass,
    // the event firing is going to fail.
    switch (eventName) {
      case "click":
      case "mousedown":
      case "mouseup":
        eventClass = "MouseEvents";
        break;

      case "focus":
      case "change":
      case "blur":
      case "select":
        eventClass = "HTMLEvents";
        break;

      default:
        throw "JSUtil.fireEvent: Couldn't find an event class for event '" + eventName + "'.";
        break;
    }
    var event = doc.createEvent(eventClass);
    var bubbles = eventName == "change" ? false : true;  
    event.initEvent(eventName, bubbles, true); // All events created as bubbling and cancelable.

    event.synthetic = true; // allow detection of synthetic events
    node.dispatchEvent(event);
  }
};



function get_db_dump() {

  var dump = { consumptions: [], drinks:[], servings: []};
  var dfd = new jQuery.Deferred();


  getdb().objectStore(STORE_NAME_SERVINGS).each(function(item) {
    dump.servings.push(item.value);
  }).then(function() {
    return getdb().objectStore(STORE_NAME_DRINKS).each(function(item) {
      dump.drinks.push(item.value);
    });
  }, dfd.reject).then(function() {
    return getdb().objectStore(STORE_NAME_CONSUMPTIONS).each(function(item) {
      dump.consumptions.push(item.value);
    });
  }, dfd.reject).then(function() {
    dfd.resolve(dump);
  }, dfd.reject);

  return dfd.promise();
}


var page_db_dump = new Page("#page-dump", {
  oncreate: function() {
    this.onbutton('.btn-dump', this.dump);
    this.onbutton('.btn-recreate', this.recreate);
    this.onbutton('.btn-load', this.load);
    this.onbutton('.btn-email', this.email);
  },
  clear: function() {
    this.find('.field-dump').val('');
  },
  recreate: function() {
    if (! confirm("Really recreate database? This will delete everything!")) {
      return;
    }
    var that = this;
    start_loading_animation();
    getdb().deleteDatabase().then(function() {
      return opendb();
    }, promiseErrorHandler("delete database")).then(function() {
      that.dump();
      end_loading_animation();
      alert("database recreated");
    }, promiseErrorHandler("open database"));
  },
  load: function() {

    if (! confirm("Really load dump? This will overwrite all current data")) {
      return;
    }
    var that = this;
    var text = b64_to_utf8(this.find('.field-dump').val());
    var data;
    try {
      data = JSON.parse(text);
    }
    catch (err) {
      promiseErrorHandler("failed to parse dump")(err);
      return;
    }

    start_loading_animation();
    getdb().transaction([STORE_NAME_CONSUMPTIONS, STORE_NAME_DRINKS, STORE_NAME_SERVINGS]).then(function() {
      that.dump();
      end_loading_animation();
      alert("data loaded");
    },
    promiseErrorHandler("load dump"),
    function(trans) {

      data.consumptions.forEach(function(value) {
        trans.objectStore(STORE_NAME_CONSUMPTIONS).put(value);
      });
      data.drinks.forEach(function(value) {
        trans.objectStore(STORE_NAME_DRINKS).put(value);
      });
      data.servings.forEach(function(value) {
        trans.objectStore(STORE_NAME_SERVINGS).put(value);
      });

    });
  },
  dump: function() {
    var that = this;
    start_loading_animation();
    get_db_dump().then(function(dump) {
      that.find('.field-dump').val(utf8_to_b64(JSON.stringify(dump)));
      end_loading_animation();
    }, promiseErrorHandler("get db dump field"));
  },
  email: function() {
    var that = this;
    start_loading_animation();
    get_db_dump().then(function(dump) {
      var data = utf8_to_b64(JSON.stringify(dump));
      var body=encodeURI("The database dump: \n\n\n" + data + "\n\n\n -- the drinking diary");
      var subject=encodeURI("Drinking diary database dump");
      that.find('#field-email').attr('href', "mailto:?Subject="+subject+"&body="+body);
      fireEvent( that.find('#field-email').get(0), 'click');
      end_loading_animation();
    }, promiseErrorHandler("get db dump email"));
  },
  show : function () {
  },
  hide : function () {
    this.clear();
  }
});





function consumption_to_unit(abv, amount, liter) {
  // https://en.wikipedia.org/wiki/Unit_of_alcohol#Formula
  return  +abv * amount * liter;
}


function format_ww(date_obj) {
  return String.format("{0}-{1}", date_obj.getFullYear(), date_obj.getWeek());
}

var page_stats = new Page("#page-stats", {

  show : function () {
    var that = this;
    var per_week = {};
    var per_day = [];


    start_loading_animation();
    get_db_dump().then(function(dump) {

      var ser_lit = {};
      var drink_alc = {};
      dump.servings.forEach(function (item) {
        ser_lit[item.name] = item.liter;
      });

      dump.drinks.forEach(function(item) {
        drink_alc[item.name] = item.alc;
      });

      dump.consumptions.forEach(function(item) {

        var date_obj = new Date(Date.parse(item.date));
        var ww = format_ww(date_obj);
        if ( !(ww in per_week) ) { 
          per_week[ww] = { sum: 0, cons: [] } 
        }
        var consumption = { date: item.date, units: 0 };
        item.drinks.forEach(function (d) {
          var units = consumption_to_unit(drink_alc[d.drink], d.amount, ser_lit[d.servings]);
          console.assert(units < 40);
          consumption.units += units;
          console.assert(consumption.units != null && ! isNaN(consumption.units));
        });
        per_week[ww].sum += consumption.units;
        per_week[ww].cons.push(consumption);
        per_day.push(consumption);
      });

      for (var ww in per_week) {
        if (per_week[ww].cons.length == 0) {
          per_week[ww].daily = 0;
        }
        else {
          per_week[ww].daily = per_week[ww].cons.reduce(function(a,b) { return b.units +a },0) / per_week[ww].cons.length;
        }
      }

      var table = that.find('.field-weekly tbody');
      for (var ww in per_week) {
        var entry = $("<tr>"+
                      "<td>"+ww+"</td>" +
                        "<td>"+per_week[ww].sum.toFixed(1)+"</td>"+
                          "<td>"+per_week[ww].daily.toFixed(1)+"</td>"+
                            "<td>"+per_week[ww].cons.length+"</td>"+
                              "</tr>");
        table.append(entry);
      }

      //that.find('.field-stats').val(JSON.stringify(per_week));
      end_loading_animation();
    }, promiseErrorHandler("get dump, stats"));

  },
  hide : function () {
      //this.find('.field-stats').val('');
      this.find('.field-weekly tbody').empty();
  }
});
