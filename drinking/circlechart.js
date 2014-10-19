
/*
* Copyright (C) 2014 mru@sisyphus.teil.cc
*/

(function( factory ) {
  factory( jQuery );
}(function( $ ) {

  'use strict';

  $.widget('ui.circlechart', {

    version: '0.1',
    defaultElement: '<div>',
    options: {
      width: 300,
      height: 300,
      value: 40,
      color_empty: 'white',
      color_filled: '#369bd7',
      color_filled_alarm: 'red',
      color_border: '#879694',
      color_text: '#111',
      heatmap_gradient: { 0: "rgb(13,255,0)", .39: "rgb(81,153,23)", .66: "rgb(212,86,2)", .84: "rgb(240,47,23)", 1: "rgb(255,21,0)" },
      font: 'normal 60pt Verdana'
    },

    _create: function() {
      var canvas = $('<canvas width="'+this.options.width+'px" height="'+this.options.height+'px" class="circlechart-canvas">');
      this.element.addClass("circlechart");
      this.element.append(canvas);
      this.options.canvas = canvas;
      this.ready = false;
      var that = this;

      this.createpalette();
      this.element.css('width', this.options.width);

      // wait for webfont load etc...
      $(window).on('load', function() {
        that.ready = true;
        that.draw();
      });
    },
    heatmap: function(value) {
      var h = (100 - value);
      var s = 100;
      var l = value * 0.50;
      return "hsl("+h+",100%,"+l+"%)";
    },
    createpalette: function() {
      var canvas = $('<canvas width="256" height="1">');
      var ctx = canvas.get(0).getContext('2d');

      var gradient = ctx.createLinearGradient(0, 0, 256, 1);
      for (var key in this.options.heatmap_gradient) {
        gradient.addColorStop(key, this.options.heatmap_gradient[key]);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 1);

      this.gradient_palette = ctx.getImageData(0, 0, 256, 1).data;
    },
    heatmap2: function(value) {
      var value1 = Math.min( Math.round(2.56 * value, 100), 255);
      var off = value1 * 4;
      var rgb =  "rgb("+this.gradient_palette[off+0]+","+this.gradient_palette[off+1]+","+this.gradient_palette[off+2]+")";
      return rgb;
    },

    get_filled_color: function(value) {
      return this.heatmap2(value);
    },

    get_text_color: function(value) {
      return this.options.color_text;
    },

    format_number: function(value) {
      return Math.floor(this.options.value) + "%";
    },

    widget: function() {
      return this.element;
    },

    _setOption: function(key, value) {
      this._super(key, value);
      this.draw();
    },

    refresh: function() {
      this.draw();
    },

    draw: function() {

      if (!this.ready) return;

      var xc = this.options.width/2;
      var yc = this.options.height/2;
      var r = Math.min(this.options.width, this.options.height) * 0.4;

      var canvas = this.element.find('canvas').get(0);
      var ctx = canvas.getContext('2d');

      ctx.fillStyle = this.options.color_empty;
      ctx.beginPath();
      ctx.arc(xc, yc, r, 0, 2*Math.PI, false);
      ctx.fill();

      var phi_0 = Math.PI/2;
      var phi = Math.acos(1 - 2*(Math.min(this.options.value, 100)/100));

      ctx.fillStyle = this.get_filled_color(this.options.value);
      ctx.beginPath();
      ctx.arc(xc, yc, r, phi_0 - phi, phi_0 + phi);
      ctx.fill();

      ctx.strokeStyle = this.options.color_border;
      ctx.lineWidth = r/10;
      ctx.beginPath();
      ctx.arc(xc, yc, r, 0, 2*Math.PI, false);
      ctx.stroke();

      var text = this.format_number(this.options.value);
      ctx.fillStyle = this.get_text_color(this.options.value);
      ctx.font = this.options.font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText (text, xc, yc);
    }
  });


  return $.ui.circlechart;
}));

