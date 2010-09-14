/**
 * jQuery Colors Core
 * @license Copyright 2010 Enideo. Released under dual MIT and GPL licenses.
*/

(function($){


var Color = function(color, format, model){

  if( this instanceof Color === false ) return new Color(color, format, model);

  if( color && color instanceof Color ){
    return color;
  }

  this.currentModel = Color.defaultModel;

  if( color ){

    if( typeof color == 'string' ) {
      color = $.trim(color);
    }

    this.inputColor = color;

    /// valid input format
    if( format && format in Color.formats &&
      Color.formats[ format ].validate( color )===true ){

      this.inputFormat = format;

    /// otherwise try to guess the format
    }else{

      if( model===undefined ){
        model = format;
      }

      for( format in Color.formats ){
        if( Color.formats[ format ].validate(color)===true ){
          this.inputFormat = format;
          break;
        }
      }

    }


    if( this.inputFormat ){

      format = Color.formats[ format ];

      this.inputModel = model || format.model || Color.defaultInputModel ;

      ///apply input format conversion to it's default model
      color = applyModelMethod( format.toModel , this.inputModel, color );

      if( this.inputModel != this.currentModel ){

        color = Color.models[ this.inputModel ].sanitize( color );

        ///convert input color to default model
        color = applyModelMethod( Color.convertModels[ this.inputModel ], this.currentModel, color );

      }

      this.color = Color.models[ this.currentModel ].sanitize( color );

    }

  }else{

    /// creates random with no arguments
    this.color = Color.models[ this.currentModel ].sanitize( );

  }

  if( this.color ){

    return this;

  }else{

    throw('Color format unknown: ' + color);

  }


}


/// provides auto detection of model methods and fallback through RGB model if models are missing

function applyModelMethod(listModelMethods, modelName, color){

  /// check if model exists
  if( modelName in listModelMethods){

    return listModelMethods[modelName]( color );

  /// else convert through RGB if possible
  }else{

    if ( modelName=='RGB' || 'RGB' in Color.convertModels[modelName] ){

      if ( modelName!='RGB' ) color = Color.convertModels[modelName].RGB( color );

      for( var existingModel in listModelMethods ){

        if ( existingModel=='RGB' || existingModel in Color.convertModels.RGB ){

          if ( existingModel!='RGB' ) color = Color.convertModels.RGB[existingModel]( color );

          /// integer format
          color = $.colors.formats.array3Octet1Normalized.fromModel.RGB(color);

          return listModelMethods[ existingModel ]( color );

        }

      }

    }

  }

  /// else throw

  throw('No valid conversion methods for this color model: ' + modelName);

}

function getSetParameter(parameter, value){
  var index,
    haystack = $.colors.models[ this.currentModel ].parameterIndexes,
    color = this.currentModel == 'RGB' ? this.format('array3Octet1Normalized') : this.color; /// integer format

  if( parameter ){
    parameter = parameter.toLowerCase();

    if( parameter in haystack ){

      if( value!==undefined ){
        this.color[ haystack[parameter] ] = value;
        this.color = $.colors.models[ this.currentModel ].sanitize(this.color);
      }else{
        return color[ haystack[parameter] ];
      }

    }else{
      throw('Parameter not in the current color model: ' + parameter );
    }
  }else{
    return color;
  }

  return this;
};


Color.prototype = {

  get : getSetParameter,
  set : getSetParameter,

  model : function( newModel ){

    if( newModel === undefined ){

      return this.currentModel;

    }else if (newModel == this.currentModel ) {

      return this;

    }else if (newModel in Color.models) {

      this.color = applyModelMethod( Color.convertModels[this.currentModel] , newModel, this.color );
      this.currentModel = newModel;

      return this;

    }else{

      throw('Model does not exist');

    }

  },

  format : function( format ){

    var color = (this.currentModel == 'RGB' && format!=='array3Octet1Normalized' )
      ? this.format('array3Octet1Normalized') : this.color; /// integer format

    if ( format && format in Color.formats ){

      return applyModelMethod( Color.formats[ format ].fromModel , this.currentModel, color );

    }else{

      throw('Format does not exist');

    }

  },

  toString : function( format ){

    if( !format || format in Color.formats === false ){
      format = Color.defaultString;
    }

    try{
      return this.format( format ).toString();
    }catch(e){
      return this.format( Color.defaultString ).toString();
    }

  },


  isFormat : function( format ){

    if ( format && format in Color.formats ){
      return Color.formats[ format ].validate( this.inputColor );
    }else{
      throw('Format does not exist');
    }

  },


  mixWith : function( colorsToAdd, options ){

    var a=0, newBlend, mixer, model, baseDosage;

    if( typeof options=='number'){
      baseDosage = options;
    }

    newBlend = this.get();
    model = this.model();

    /// check array not a valid format before assuming multiple colors
    if( $.isArray(colorsToAdd) ){
      try{
        mixer = Color(colorsToAdd);
      }catch(e){
        for ( a=0; a<colorsToAdd.length; a++ ){
          if( colorsToAdd[a] instanceof Color == false ){
            colorsToAdd[a] = Color(colorsToAdd[a]);
          }

          if(a==0){
            mixer = colorsToAdd[a].model(model);
          }else{
            /// need to weigh in the mixers progressively stronger to get an overall equal blend
            mixer = mixer.mixWith( colorsToAdd[a], a/(a+1) );
          }
        }
      }

    }else{
      if( colorsToAdd instanceof Color == false ){
        colorsToAdd = Color(colorsToAdd);
      }
      mixer = colorsToAdd;
    }

    mixer = mixer.model(model).get();

    newBlend = newBlend.slice(0);
    mixer = mixer.slice(0);

    if( baseDosage==undefined ){
      if(a){
        baseDosage = 1/(a+1);
      }else{
        baseDosage = 0.5;
      }
    }

    for ( a=0; a<newBlend.length; a++ ){

      if( 'cycleMixes' in Color.models[ model ] && Color.models[ model ].cycleMixes[a] ){
        if( Color.models[ model ].cycleMixes[a] > 0 ){
          while( newBlend[a] > mixer[a] ) mixer[a] += Color.models[ model ].cycleMixes[a];
        }else{
          while( newBlend[a] < mixer[a] ) mixer[a] += Color.models[ model ].cycleMixes[a];
        }
      }

      newBlend[a] = newBlend[a]*baseDosage + mixer[a]*(1-baseDosage) ;

    }

    newBlend = Color.models[model].sanitize(newBlend);

    return $.extend($.colors(),{color: newBlend, currentModel:model});

  }


};


Color.formats = {

  'array3Normalized' : {

    validate : function( color , maxLength ){

      var a=0, maxLength = maxLength || 3;

      if( $.isArray(color) && color.length==maxLength ){
        while ( a<maxLength ){
          if( typeof color[a] == 'number' && color[a]<=1 && color[a]>=0 ){
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

      'RGB' : function ( color ){

        return [ color[0]*255, color[1]*255, color[2]*255 ];

      }

    },

    fromModel : {

      'RGB' : function ( color ){

        return [ color[0]/255, color[1]/255, color[2]/255 ];

      }

    }

  },

  'array4Normalized' : {

    validate : function( color ){

      return Color.formats.array3Normalized.validate( color, 4 );

    },

    toModel : {

      'RGB' : function ( color ){

        return [ color[0]*255, color[1]*255, color[2]*255, color[3] ];

      }

    },

    fromModel : {

      'RGB' : function ( color ){

        var a, color = color.slice(0);

        for( a in color){
          if ( a!=3 && color[a] ){
            color[a]+=1;
            color[a]/=256;
          }
        }
        return [ color[0], color[1], color[2], color[3] ];


      }

    }

  },

  'array3Octet' : {

    validate : function( color ){

      var a=0;

      if( $.isArray(color) && color.length==3 ){
        while ( a<3 ){
          if( typeof color[a] == 'number' && color[a]<=255 && color[a]>=0 && /^\d+$/.test(color[a].toString()) ){
            a++;
          }else{
            break;
          }
        }
        if( a==3 ){
          return true;
        }
      }

      return false;

    },

    toModel : {

      'RGB' : function ( color ){

        return color.slice(0,3);

      }

    },

    fromModel : {

      'RGB' : function ( color ){

        return color.slice(0,3);

      }

    }
  },

  'array3Octet1Normalized' : {

    validate : function( color ){

      var a=0;

      if( $.isArray(color) && color.length==4 ){
        while ( a<3 ){
          if( typeof color[a] == 'number' && color[a]<=255 && color[a]>=0 && /^\d+$/.test(color[a].toString()) ){
            a++;
          }else{
            break;
          }
        }
        if( a==3 && color[3]>=0 && color[3]<=1 ){
          a++;
        }
        if( a==4 ){
          return true;
        }
      }

      return false;

    },

    toModel : {

      'RGB' : function ( color ){

        return color.slice(0,4);

      }

    },

    fromModel : {

      'RGB' : function ( color ){

        var a=0;

        color = color.slice(0,4)

        while(a<3){
          color[a] = Math.round( color[a] );
          a++;
        }

        return color;

      }

    }
  },

  /// Strings

  'rgb' : {

    validate : function( color, returnTuples ){

      var a=1, result;

      if( color && typeof color == 'string' &&
        (result = /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/.exec(color)) ){

        while ( a<4 ){
          result[a] = parseInt(result[a])
          if( result[a] < 256 ){
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

      'RGB' : function(rgb){
        return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
      }
    },

    toModel : {

      'RGB' : function(rgbString){
        var result = Color.formats.rgb.validate(rgbString,true);
        if(result===false){
          return null;
        }else{
          return result;
        }

      }
    },
    model : 'RGB'
  },

  'rgba' : {

    validate : function( color, returnTuples ){

      var a=1, result;

      if( color && typeof color == 'string' &&
        (result = /^rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*(0|1|0\.[0-9]+)\s*\)$/.exec(color)) ){

        while ( a<4 ){
          result[a] = parseInt(result[a])
          if( result[a] < 256 ){
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

      'RGB' : function(rgb){
        return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + rgb[3] + ')';
      }
    },

    toModel : {

      'RGB' : function(rgbaString){
        var result = Color.formats.rgba.validate(rgbaString,true);
        if(result===false){
          return null;
        }else{
          return result;
        }
      }
    },
    model : 'RGB'
  },

  'transparent' : {

    validate : function( color ){

      return ( color && typeof color == 'string' && /^transparent$/i.test(color) );

    },

    fromModel : {

      'RGB' : function(rgb){
        if( rgb[3]==0 ) {
          return 'transparent';
        }else{
          throw('Color is not transparent: ' + rgb.toString() );
        }
      }
    },

    toModel : {

      'RGB' : function( ){
        return [255,255,255,0];
      }

    }
  }

}


Color.models = {
  'RGB' : {

    sanitize : function( rgb ){
      var a;

      if ( !rgb || !$.isArray(rgb) ){
        rgb = [
          Math.floor(256*Math.random()),
          Math.floor(256*Math.random()),
          Math.floor(256*Math.random()),
          Math.random()
        ];
      }

      while( rgb.length<4 ){

        if(rgb.length==3){
          rgb.push( 1 );
        }else{
          rgb.push( 0 );
        }

      }

      rgb = rgb.slice(0,4);

      for( a=0; a<rgb.length; a++ ){

        if ( !rgb[a] ){
          rgb[a] = 0;
        }

        if( a<3 ){

          if( rgb[a] > 255 ){
            rgb[a] = 255;
          }
          if( rgb[a] < 0 ){
            rgb[a] = 0;
          }
        }else if ( a==3 ){
          rgb[a] = parseFloat(rgb[a])
          if( rgb[a] > 1 ){
            rgb[a] = 1;
          }
          if( rgb[a] < 0 ){
            rgb[a] = 0;
          }
        }
      }

      return rgb;
    },

    parameterIndexes : {
      'r':0,
      'g':1,
      'b':2,
      'a':3,
      'red':0,
      'green':1,
      'blue':2,
      'alpha':3
    }

  }
};

Color.convertModels = {};

Color.defaultInputModel = Color.defaultModel = 'RGB';
Color.defaultString = 'rgb';

if($.colors===undefined){
  $.extend({colors:Color});
}


})(jQuery);
