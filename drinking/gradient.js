/*
* Copyright (C) 2014 mru@sisyphus.teil.cc
*/

(function($) {
  "use strict";

  $.colorgradient = function(options) {
    var params = $.extend({
      nvalues: 100,
      stops: { 0: "rgb(13,255,0)", .39: "rgb(81,153,23)", .66: "rgb(212,86,2)", .84: "rgb(240,47,23)", 1: "rgb(255,21,0)" },
    }, options);


    var canvas = $('<canvas width="'+params.nvalues+'" height="1">');
    var ctx = canvas.get(0).getContext('2d');

    var gradient = ctx.createLinearGradient(0, 0, params.nvalues, 1);
    for (var key in params.stops) {
      gradient.addColorStop(key, params.stops[key]);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, params.nvalues, 1);

    var p = ctx.getImageData(0, 0, params.nvalues, 1).data;
    var result = [];
    for (var i = 0; i < params.nvalues; i++) {
      result.push( 'rgb('+p[i*4]+','+p[i*4+1]+','+p[i*4+2]+')' );
    }

    return function(idx) {
      var values = result;
      idx = Math.min(Math.max(idx, 0), values.length-1);
      return values[idx];
    };
  };

})( jQuery );

