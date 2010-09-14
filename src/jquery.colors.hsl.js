/**
 * jQuery Colors HSL
 * @license Copyright 2010 Enideo. Released under dual MIT and GPL licenses.
*/

(function($){

var hslRgbConversion = {
  /// Credits to http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
  'RGB' : {
    'HSL' : function(rgb){

      var r = rgb[0]/255,
        g = rgb[1]/255,
        b = rgb[2]/255,
        max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        delta = max - min,
        h, s,
        l = (max + min) / 2;

      if(max == min){
          h = s = 0; // achromatic
      }else{
          s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
          if( max==r ){

              h = (g - b) / delta + (g < b ? 6 : 0);

          }else if ( max==g ){

              h = (b - r) / delta + 2;

          }else{ /// max==b

            h = (r - g) / delta + 4;

          }
          h /= 6;
      }

      return [h*360, s*100, l*100, rgb[3]];
    }

  },

  'HSL' : {
    'RGB' : function(hsl){

      var r, g, b, q, p,
        h = hsl[0]/360,
        s = hsl[1]/100,
        l = hsl[2]/100;

      if(s == 0){
          r = g = b = l; // achromatic

      }else{

          q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }

      return [r * 255, g * 255, b * 255, hsl[3]];

      function hue2rgb(p, q, t){
        if( t<0 ) t+=1;
        if( t>1 ) t-=1;

        if(t < 1/6) {
          return p + (q - p) * 6 * t;
        }else if(t < 1/2) {
          return q;
        }else if(t < 2/3) {
          return p + (q - p) * (2/3 - t) * 6;
        }else{
          return p;
        }
      }

    }
  }
},

  hslModel = {
    'HSL' : {
      sanitize : function( hsl ){
        var a;

        if ( !hsl || !$.isArray(hsl) ){
          hsl = [
            Math.floor(361*Math.random()),
            Math.floor(101*Math.random()),
            Math.floor(101*Math.random()),
            Math.random()
          ];
        }


        while( hsl.length<4 ){
          if(hsl.length==3){
            hsl.push( 1 );
          }else{
            hsl.push( 0 );
          }
        }

        hsl = hsl.slice(0,4);

        for( a=0; a<hsl.length; a++ ){

          if (!hsl[a] ){
            hsl[a] = 0;
          }

          hsl[a] = parseFloat(hsl[a]);

          if( a==0 ){

            while( hsl[a] > 360 ){
              hsl[a] -= 360;
            }
            if( hsl[a] < 0 ){
              hsl[a] += 360;
            }

          }else if( a<3 ){

            while( hsl[a] > 100 ){
              hsl[a] = 100;
            }
            if( hsl[a] < 0 ){
              hsl[a] = 0;
            }
          }else if ( a==3 ){

            if( hsl[a] > 1 ){
              hsl[a] = 1;
            }
            if( hsl[a] < 0 ){
              hsl[a] = 0;
            }
          }
        }

        return hsl;
      },

      parameterIndexes : {
        'h':0,
        's':1,
        'l':2,
        'a':3,
        'hue':0,
        'saturation':1,
        'lightness':2,
        'alpha':3
      },

      cycleMixes : [360,0,0,0],

      reverseCylce : function ( parameter ){
        this.cycleMixes[ this.parameterIndexes[ parameter ] ] *= -1;
      }

    }

  },

  hslFormats = {

    'array3Normalized' : {
      toModel : {
        'HSL' : function ( color ){
          return [ color[0]*360, color[1]*100, color[2]*100 ];
        }
      },

      fromModel : {
        'HSL' : function ( color ){
          return [ color[0]/360, color[1]/100, color[2]/100 ];
        }
      }
    },

    'array4Normalized' : {
      toModel : {
        'HSL' : function ( color ){
          return [ Math.round(color[0]*360), color[1]*100, color[2]*100, color[3] ];
        }
      },
      fromModel : {
        'HSL' : function ( color ){
          return [ color[0]/360, color[1]/100, color[2]/100, color[3] ];
        }
      }
    },

    'array1Circle2Normalized' : {

      validate : function( color , maxLength ){

        var a=0, maxLength = maxLength || 3;

        if( $.isArray(color) && color.length==maxLength ){
          while ( a<maxLength ){
            if( typeof color[a] == 'number' && color[a]>=0 &&
              ( ( a==0 && color[a]<=360 ) || (a>0 && color[a]<=1 ) ) ){
              a++;
            }else{
              break;
            }
          }
          if( a==maxLength ){
            return true;
          }
        }

        return false;

      },

      toModel : {
        'HSL' : function ( color ){
          return [ color[0], color[1]*100, color[2]*100 ];
        }
      },
      fromModel : {
        'HSL' : function ( color ){
          return [ color[0], color[1]/100, color[2]/100 ];
        }
      }

    },

    'array1Circle3Normalized' : {

      validate : function( color ){

        return hslFormats.array1Circle2Normalized.validate( color, 4 );

      },

      toModel : {
        'HSL' : function ( color ){
          return [ color[0], color[1]*100, color[2]*100, color[3] ];
        }
      },
      fromModel : {
        'HSL' : function ( color ){
          return [ color[0], color[1]/100, color[2]/100, color[3] ];
        }
      }

    },

    'array1Circle2Percentage' : {

      validate : function( color, maxLength ){

        var a=0, maxLength = maxLength || 3;

        if( $.isArray(color) && color.length==maxLength ){
          while ( a<maxLength ){
            if( typeof color[a] == 'number' && color[a]>=0 &&
              ( ( a==0 && color[a]<=360 ) || ((a==1||a==2) && color[a]<=100 ) || ( a==3 && color[a]<=1 ) ) ){
              a++;
            }else{
              break;
            }
          }
          if( a==maxLength ){
            return true;
          }
        }

        return false;

      },

      toModel : {
        'HSL' : function ( color ){
          return color.slice(0,3);
        }
      },
      fromModel : {
        'HSL' : function ( color ){
          return color.slice(0,3);
        }
      }

    },

    'array1Circle2Percentage1Normalized' : {

      validate : function( color ){

        return hslFormats.array1Circle2Percentage.validate( color, 4 );

      },

      toModel : {
        'HSL' : function ( color ){
          return color.slice(0,4);
        }
      },
      fromModel : {
        'HSL' : function ( color ){
          return color.slice(0,4);
        }
      }

    }


  },

  hslStrings = {

    'hsl' : {

      validate : function( color, returnTuples ){

        var a=1, result;

        if( color && typeof color == 'string' &&
          (result = /^hsl\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*\)$/.exec(color)) ){

          while ( a<4 ){
            result[a] = parseInt(result[a])
            if( ( a==0 && result[a] <= 360 ) || ( a>0 && result[a]<=100 ) ){
              a++;
            }else{
              break;
            }
          }

          if( a==4 ){
            if( returnTuples ){
              result.shift();
              return result.slice(0);
            }else{
              return true;
            }
          }

        }
        return false;
      },

      fromModel : {

        'HSL' : function(hsl){
          return 'hsl(' + Math.round(hsl[0]) + ',' + Math.round(hsl[1]) + ',' + Math.round(hsl[2]) + ')';
        }
      },

      toModel : {

        'HSL' : function(hslString){
          var result = hslStrings.hsl.validate(hslString,true);
          if(result===false){
            return null;
          }else{
            return result;
          }

        }
      },
      model : 'HSL'
    },

    'hsla' : {

      validate : function( color, returnTuples ){

        var a=1, result;

        if( color &&  typeof color == 'string' &&
          (result = /^hsla\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})%\s*,\s*([0-9]{1,3})%\s*,\s*(0|1|0\.[0-9]+)\s*\)$/.exec(color)) ){

          while ( a<4 ){
            result[a] = parseInt(result[a])
            if( ( a==0 && result[a] <= 360 ) || ( a>0 && result[a]<=100 ) ){
              a++;
            }else{
              break;
            }
          }

          if( a==4 && result[4]>=0 && result[4]<=1 ){
            result[a] = parseFloat(result[a])
            a++;
          }

          if( a==5 ){
            if( returnTuples ){
              return result.slice(1);
            }else{
              return true;
            }
          }

        }
        return false;
      },

      fromModel : {

        'HSL' : function(hsl){
          return 'hsla(' + Math.round(hsl[0]) + ',' + Math.round(hsl[1]) + ',' + Math.round(hsl[2]) + ',' + hsl[3] + ')';
        }
      },

      toModel : {

        'HSL' : function(hslaString){
          var result = hslStrings.hsla.validate(hslaString,true);
          if(result===false){
            return null;
          }else{
            return result;
          }
        }
      },
      model : 'HSL'
    }


  };


$.extend(true, $.colors.convertModels,hslRgbConversion);
$.extend($.colors.models,hslModel);
$.extend(true,$.colors.formats,hslFormats);
$.extend($.colors.formats,hslStrings);


})(jQuery);