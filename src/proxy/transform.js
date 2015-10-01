'use strict';

// built-in/third-party modules
var Url         = require( 'url' ),
    _           = require( 'lodash' );

// custom modules
var config      = require( '../config' ),
    log         = require( '../log' ),
    utils       = require( '../utils' );

/*
 * parse url transformation string returning a transformation object
 *
 * @param     string    str       string to parse ( key_value,key_value,key_value )
 * @returns   object              transformation object
 */
var parseUrl = function( str ) {
  var transform,
      strList;

  strList = str.split( ',' );
  if ( strList.length > 0 ) {
    strList.forEach( function( e ) {
      var item = e.split( '_' );
      if ( item.length > 1 && config.transformOptions.indexOf( item[ 0 ] ) >= 0 ) {
        transform = transform || {};
        transform[ item[ 0 ] ] = item[ 1 ];
      }
    } );
  }
  return transform;
};
module.exports.parseUrl = parseUrl;

/*
 * parse a querystring object returning a tranformation object
 * the string should be a valid querystring
 *
 * @param     object      qs      querystring object
 * @returns   object              transformation object
 */
var parseQS = function( qs ) {
  return _.pick( qs, config.transformOptions );
};
module.exports.parseQS = parseQS;


/*
 * Create a duplex transformer stream to handle the necessary media transformations
 * @param     object    options             processing options
 */
var transformMedia = function( options ) {
  // INFO: options.__sharpLib is just a way of making this soft dependency module
  //       testable it should not be specified by any call to transformMedia
  var sharp = options.__sharpLib || require( 'sharp' );

  var width = options.w ? parseInt( options.w, 10 ) || null : null,
      height = options.h ? parseInt( options.h, 10 ) || null : null,
      xwidth = options.xw ? parseInt( options.xw, 10 ) || null : null,
      xheight = options.xh ? parseInt( options.xh, 10 ) || null : null,
      xtop = options.xt ? parseInt( options.xt, 10 ) || 0 : 0,
      xleft = options.xl ? parseInt( options.xl, 10 ) || 0 : 0,
      gravity = options.g || null,
      quality = options.q ? parseInt( options.q ) || config.transformQuality : config.transformQuality,
      format = options.f || null,
      resizeDone = false,
      rotateDone = false,
      mirrorDone = false,
      extractDone = false,
      transformer;

  transformer = sharp();

  // images won't enlarge past its original size
  // todo: I don't know if this is desirable for all operations
  if ( config.transformWithoutEnlargement ) {
    transformer.withoutEnlargement();
  }

  _.each( options, function( value, operation ) {
    switch( operation ) {
      case 's':
        if ( !resizeDone ) {
          switch ( value ) {
            case 'scale':
              if ( width || height ) {
                transformer.resize( width, height );
                if ( width && height ) {
                  transformer.ignoreAspectRatio();
                }
                resizeDone = true;
              }
              break;
            case 'fit':
              if ( width && height ) {
                transformer.resize( width, height );
                transformer.max();
                resizeDone = true;
              }
              break;
            case 'fill':
              if ( width && height ) {
                transformer.resize( width, height );
                transformer.min();
                resizeDone = true;
              }
              break;
          }
        }
        break;
      case 'x':
        if ( !extractDone && value === 'crop' && ( xwidth && xheight ) ) {
          transformer.extract( xtop, xleft, xwidth, xheight );
          extractDone = true;
        }
        break;
      case 'r':
        if ( !rotateDone && config.transformAngles.indexOf( value ) >= 0 ) {
          transformer.rotate( parseInt( value, 10 ) );
          rotateDone = true;
        }
        break;
      case 'm':
        if ( !mirrorDone ) {
          switch( value ) {
            case 'flip':
              transformer.flip();
              mirrorDone = true;
              break;
            case 'flop':
              transformer.flop();
              mirrorDone = true;
              break;
          }
        }
        break;
    }
  } );

  // when no operation that requires width and height were done, but either width and/or height
  // is provided then default to resize scale
  if ( !resizeDone && !extractDone && ( width || height ) ) {
    transformer.resize( width, height );
    if ( width && height ) {
      transformer.ignoreAspectRatio();
    }
  }

  if ( quality && quality > 0 && quality <= 100 ) {
    transformer.quality( quality );
  }

  if ( format && config.transformFormats.indexOf( format ) >= 0 ) {
    transformer.toFormat( format );
  }

  return transformer;
};

/*
 * get the transformer streaming instance
 *
 * @param       object      res                 main response object
 * @param       object      mediaRes            media response object
 * @param       object      options             transform options
 * @param       string      reqUrl              main request url
 * @param       string      mediaUrl            media request url
 * @returns     stream                          transformer stream
 */
var getTransformer = function( res, mediaRes, options, reqUrl, mediaUrl ) {
  var transformer,
      infoObj = {
        'reqUrl': reqUrl,
        'mediaUrl': mediaUrl,
        'transform': options
      };

  try {
    transformer = transformMedia( options );

    transformer.on( 'end', function() {
      res._media.pendingTransform = false;
      if ( res._media.finished && !res._media.transformError ) {
        return utils.finish( res );
      }
    } );

    transformer.on( 'error', function( err ) {
      var errorObj = _.clone( infoObj );
      errorObj.err = err;

      res._media.pendingTransform = false;
      res._media.transformError = true;

      mediaRes.destroy();

      if ( config.transformRedirectOnError ) {
        // only log if redirect on error is set, otherwise let the fiveHundred logs the error
        log.error( 'failed transforming image', errorObj );

        var redirectUrl = Url.parse( reqUrl, true );

        // remove any transform information from the url
        redirectUrl.search = '';
        for ( var i = 0, j = config.transformOptions.length; i < j; i++ ) {
          delete redirectUrl.query[ config.transformOptions[ i ] ];
        }
        var redirectPath = redirectUrl.pathname.split( '/' );
        if ( redirectPath.length > 3 ) { // 3 === leading slash and two paramenters
          redirectPath.pop();
        }
        redirectUrl.pathname = redirectPath.join( '/' );

        // redirect the request
        res.writeHead( 302, {
          'Location': redirectUrl.format()
        } );
        return utils.finish( res );
      }
      else {
        return utils.fiveHundred( res, 'Failed transforming media', Url.parse( mediaUrl ), errorObj );
      }
    } );
  }
  catch( e ) {
    log.error( e, infoObj );
  }

  return transformer;
};
module.exports.getTransformer = getTransformer;
