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

function getRange(n) {
  return Array(n).join().split(',').map(function(e, i) { return i+1; });
}  


function utf8_to_b64( str ) {
  return B64.encode(str);
}

function b64_to_utf8( str ) {
  return B64.decode(str);
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

function format_ww(date_obj) {
  return String.format("{0}-{1}", date_obj.getFullYear(), date_obj.getWeek());
}


function consumption_to_unit(abv, amount, liter) {
  // https://en.wikipedia.org/wiki/Unit_of_alcohol#Formula
  return  +abv * amount * liter;
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
var going_to_error_page = false;
function promiseErrorHandler(msg) {
  return function(a, e) {
    if (a == null) a = { message: "unknown" };
    if (typeof a.message != "string") a.message= "unknown";
    console.log(msg + ": Action error: " + a.message, a, e);
    last_error = msg + ": " + a.message;
    going_to_error_page = true;
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
        return handler_fn.apply(self, arguments);
      }
    },
    is_error_page_: function() {
      return this.selector == "#page-show-error";
    },
    show_: function() {
      if ( this.is_error_page_() ) {
        this.show__();
      }
      else {
        // don't show when coming from error page.
        if ( going_to_error_page ) {
          going_to_error_page = false;
        }
        else {
          this.show__();
        }
      }
    },
    show__: function() {
      var that = this;
      var ret = this.show();
      // XXX test if ret is a thenable
      if (ret != null) {
        start_loading_animation();
        ret.then(function() {
          end_loading_animation();
        }, promiseErrorHandler("Show page " + that.selector));
      }
    },
    show_with_value: function(value) {
      this.value = value;
      $.mobile.changePage(this.selector);
    },
    oncreate_: function() {
      if (typeof this.oncreate != "undefined") {
        this.oncreate();
      }
    },
    hide_: function() {
      // don't hide when going to error page
      if (! going_to_error_page ) {
        self.value = null;
        self.hide();
      }
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
function makeExceptionHandlingPromise(handler) {
  return function() {
    var dfd = new jQuery.Deferred();
    try {
      dfd.resolve(handler.apply(this, arguments));
    }
    catch (err) {
      dfd.reject(err);
    }
    return dfd.promise();
  }
}
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


function easyPromise() {
  var dfd = new jQuery.Deferred();
  dfd.resolve.apply(arguments);
  return dfd.promise();
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
  }, promiseErrorHandler("Open database"));
});


$(document).on('pagebeforecreate', '', function (event) {
  var copy = 'Copyright &copy; 2014 <a href="mailto:mru@sisyphus.teil.cc">mru@sisyphus.teil.cc</a>';
  $(event.target).append('<div data-role="footer" style="text-align: center"><small>'+copy+'</small></div>')
});




// validator promises:

var validateConsumption = makeExceptionHandlingPromise(function(value) {

  // XXX should also check if drink, serving really exists
  //
  console.assert(value != null);
  console.assert(value.drinks != null);
  if ( (new Date(value.date)) == null ) {
    throw new Error ("Invalid date specified");
  }
  if ( value.drinks.length == 0) {
    throw new Error ("No drinks specified!");
  }
  value.drinks.forEach(function (d) {

    if (d.amount == "") {
      throw new Error("No amount specified");
    }
    if (d.servings == "") {
      throw new Error ("No serving size specified");
    }
    if (d.drink == "") {
      throw new Error ("No drink specified");
    }

  });
  return value;
});


var validateDrink = makeExceptionHandlingPromise(function(value) {

  console.assert(value != null);
  if (value.name == null || value.name == "") {
    throw new Error ("No name specified!");
  }
  if (value.alc == null || value.alc == "") {
    throw new Error ("No ABV specified");
  }
  return value;
});


var validateServing = makeExceptionHandlingPromise(function(value) {
  console.assert(value != null);
  if (value.name == null || value.name == "") {
    throw new Error ("No name specified!");
  }
  if (value.liter == null || value.liter == "") {
    throw new Error ("No liters specified");
  }
  return value;
});



// html helper functions


function createEditListEntry(name, target_page, value) {
  var elem = $('<li><a href="#" class="btn-edit btn ui-btn ui-btn-icon-right ui-icon-edit">'+name+'</a></li>'); 
  elem.click(function() { target_page.show_with_value(value); });
  return elem;
}

function populateOptions(collection, accessor, selected, target) {
  collection.forEach(function(item) {
    var elem = $( String.format('<option value="{0}">{1}</option>', encodeURI(accessor(item)), accessor(item)) );
    target.append( elem );
    if (selected != null && accessor(item) == selected) {
      elem.attr('selected',"selected").trigger('change');
    }
  });
}




function createConsumptionTitle(value) {
  var now = new Date();
  var today = formatDate(now);
  var yesterday = formatDate(previousDay(now));
  var is_today = value.date == today;
  var is_yesterday = value.date == yesterday;
  return String.format('{0}: {1}',
                       is_today ? "today" : is_yesterday ? "yesterday" : value.date,
                       value.drinks
                       .map(function(drink) {return String.format("{0} {1} {2}", drink.amount, drink.servings, drink.drink); })
                       .join(', ')
                      );
}
var page_main = new Page("#page-main", {

  oncreate: function() {
    this.onbutton('.btn-insert-base-data', this.insert_base_data);
  },
  show: function() {
    var target_ul = this.find('.field-list');

    var now = new Date();
    var today = formatDate(now);
    var yesterday = formatDate(previousDay(now));

    // XXX intentinally no error handling here. bad, but better than
    // endless error->main->error loops.
    return getdb().objectStore(STORE_NAME_CONSUMPTIONS).get(yesterday).then(function(value) {
      if (value != null) {
        target_ul.append(createEditListEntry(createConsumptionTitle(value),
                                             page_consumption_details,
                                             yesterday));
      }

      return getdb().objectStore(STORE_NAME_CONSUMPTIONS).get(today)

    }).then(function(value) {
      if (value != null) {
        target_ul.append(createEditListEntry(createConsumptionTitle(value),
                                             page_consumption_details,
                                             today));
      }
      return easyPromise();
    });
  },
  hide : function() { 
    this.find('.field-list').empty();
  }
});








var page_consumptions = new Page("#page-consumptions", {
  show : function() {
    var target_ul = this.find('.field-list');

    return getdb().objectStore(STORE_NAME_CONSUMPTIONS).each(function(item) {
      target_ul.append(createEditListEntry(createConsumptionTitle(item.value),
                                           page_consumption_details,
                                           item.key));
    });
  },
  hide : function() {
    this.find('.field-list').empty();
  }
});








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
      this.find('.field-date').removeAttr('readonly');
    }
    else {
      today = this.value;
      this.find('.field-date').attr('readonly', 'readonly');
    }


    var self = this;
    var input_date = this.find('.field-date');

    self.drinks = [];
    self.servings = [];

    return getdb().transaction([STORE_NAME_DRINKS, STORE_NAME_SERVINGS, STORE_NAME_CONSUMPTIONS]).then( function() {
      return easyPromise();
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
      }, promiseErrorHandler("get consumption"));

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
    validateConsumption(value).then(function(value) {
      return getdb().objectStore(STORE_NAME_CONSUMPTIONS).put(value);
    }).then( function() {
      $.mobile.changePage('#page-main');
    }, promiseErrorHandler("Save consumption"));
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















var page_drinks = new Page("#page-drinks", {

  show : function() {
    var target_ul = this.find('.field-drinks');

    return getdb().objectStore(STORE_NAME_DRINKS).each(function (item) {
      target_ul.append(createEditListEntry(item.value.name,
                                           page_drink_details,
                                           item.value));
    });
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

    validateDrink(value).then(function(value) {
      return getdb().objectStore(STORE_NAME_DRINKS).put(value);
    }).then(function() {
      $.mobile.changePage('#page-drinks');
    }, promiseErrorHandler("Save drink"));
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






var page_servings = new Page("#page-servings", {
  show : function() {
    var target_ul = this.find('.field-servings');

    return getdb().objectStore(STORE_NAME_SERVINGS).each(function(item) {
      target_ul.append(createEditListEntry(String.format("{0} -- {1}l", item.value.name, item.value.liter),
                                           page_serving_details,
                                           item.value));
    });
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
    validateServing(value).then(function(value) {
      return getdb().objectStore(STORE_NAME_SERVINGS).put(value);
    }).then(function() {
      $.mobile.changePage('#page-servings');
    }, promiseErrorHandler("Save serving"));
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
    if (last_error == null) {
      this.find(".field-error").text("Unknown error");
    }
    else {
      this.find(".field-error").text(last_error);
    }
  },
  hide : function () {
    this.find('.field-error').text('');
  }
});








function get_db_dump() {

  var dump = { consumptions: [], drinks:[], servings: []};
  var dfd = new jQuery.Deferred();


  getdb().objectStore(STORE_NAME_SERVINGS).each(function(item) {
    dump.servings.push(item.value);
  }).then(function() {
    return getdb().objectStore(STORE_NAME_DRINKS).each(function(item) {
      dump.drinks.push(item.value);
    });
  }).then(function() {
    return getdb().objectStore(STORE_NAME_CONSUMPTIONS).each(function(item) {
      dump.consumptions.push(item.value);
    });
  }).then(function() {
    dfd.resolve(dump);
  }, dfd.reject);

  return dfd.promise();
}

var decode_dump = makeExceptionHandlingPromise(function(input) {
    if (input == "") {
      throw new Error("No data given. Make sure a dump is entered in the input field.");
    }
    // copy-paste might add spaces at the front, re-sub them
    var text = b64_to_utf8(input.replace(/^\s+|\s+$/g,''));
    return JSON.parse(text);
});

var encode_dump = makeExceptionHandlingPromise(function(input) {
    console.assert(input != null);
    return utf8_to_b64(JSON.stringify(input));
});

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
    }).then(function() {
      that.dump();
      end_loading_animation();
      alert("database recreated");
    }, promiseErrorHandler("Recreate database"));
  },
  load: function() {

    if (! confirm("Really load dump? This will overwrite all current data")) {
      return;
    }
    var that = this;
    var dump_data;

    start_loading_animation();
    decode_dump(this.find('.field-dump').val()).then(function (data) {
      dump_data = data;
      return getdb().transaction([STORE_NAME_CONSUMPTIONS, STORE_NAME_DRINKS, STORE_NAME_SERVINGS]);
    }).then(function () {
      that.dump();
      alert("Dump successfully loaded");
      end_loading_animation();
    },
    promiseErrorHandler("Load dump"),
    function(trans) {

      dump_data.consumptions.forEach(function(value) {
        trans.objectStore(STORE_NAME_CONSUMPTIONS).put(value);
      });
      dump_data.drinks.forEach(function(value) {
        trans.objectStore(STORE_NAME_DRINKS).put(value);
      });
      dump_data.servings.forEach(function(value) {
        trans.objectStore(STORE_NAME_SERVINGS).put(value);
      });

    });
  },
  dump: function() {
    var that = this;
    var encoded;
    start_loading_animation();
    get_db_dump().then(function(dump) {
      return encode_dump(dump);
    }).then(function(_encoded) {
      //sanity check: test if encoded is decodable
      encoded = _encoded;
      return decode_dump(encoded);
    }).then(function() {
      that.find('.field-dump').val(encoded);
      end_loading_animation();
    }, promiseErrorHandler("get db dump field"));
  },
  email: function() {
    var that = this;
    start_loading_animation();
    get_db_dump().then(function(dump) {
      var data = utf8_to_b64(JSON.stringify(dump));
      var body=encodeURI("The database dump: \n\n\n" + data + "\n\n\n-- \nthe drinking diary");
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



// simple promise, always resolved, d/c about result
function invokeLater(handler) {

  var dfd = new jQuery.Deferred();

  window.setTimeout(function() {
    handler().then(dfd.resolve, dfd.reject);
  }, 0);


  return dfd.promise();
}





var page_stats = new Page("#page-stats", {

  oncreate: function() {
    this.find('.field-chart').hide();
    this.find('.field-chart').circlechart({width: 200, 
                                          height:200, 
                                          font: "normal 45pt sans-serif",
                                          value: 0,
                                          visible: false});
  },
  show : function () {
    var that = this;
    var per_week = {};
    var per_day = [];


    return get_db_dump().then(function(dump) {

      return invokeLater(makeExceptionHandlingPromise(function() {

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
            if (units != null && ! isNaN(units)) {
              consumption.units += units;
            }
            else {
              consumption.is_incomplete = true;
            }
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


        // weekly goal intake
        var goal = 20;
        var current;
        var this_ww = format_ww(new Date());
        if ( per_week[this_ww] == null ) {
          current = 0;
        }
        else {
          current = per_week[this_ww].sum;
        }
        that.find('.field-chart').circlechart('option', 'value', 100*current/goal);
        that.find('.field-chart').show();
      }));
    })
  },
  hide : function () {
      this.find('.field-weekly tbody').empty();
  }
});
