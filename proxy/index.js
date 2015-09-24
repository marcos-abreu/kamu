'use strict';

// built-in/third-party modules
var Crypto      = require( 'crypto' ),
    Http        = require( 'http' ),
    Https       = require( 'https' ),
    QueryString = require( 'querystring' ),
    Url         = require( 'url' ),
    _           = require( 'lodash' );

// custom modules
var config      = require( './config' ),
    log         = require( './log' ),
    connStatus  = require( './connection-status' );

/*
 * finish a response
 *
 * @param     object    res     http response object
 */
var finish = function( res, str ) {
  connStatus.close();
  // todo: why verifying the connection before ending the response
  //       I couldn't find anything in the official docs
  // log.debug( '>>> response end called from finish method' );
  return res.connection && res.end( str );
};

/*
 * write the error response headers
 *
 * @param     res           object        response object
 * @param     statusCode    integer       numeric response code to write
 */
var writeErrorHead = function( res, statusCode ) {
  res.writeHead( statusCode, {
    'expires': '0',
    'Cache-Control': 'no-cache, no-store, private, must-revalidate',
    'X-Frame-Options': config.defaultHeaders[ 'X-Frame-Options' ],
    'X-XSS-Protection': config.defaultHeaders[ 'X-XSS-Protection' ],
    'X-Content-Type-Options': config.defaultHeaders[ 'X-Content-Type-Options' ],
    'Content-Security-Policy': config.defaultHeaders[ 'Content-Security-Policy' ],
    'Strict-Transport-Security': config.defaultHeaders[ 'Strict-Transport-Security' ]
  } );
};

/*
 * respond with a 404 response
 *
 * @param   object    res     http response object
 * @param   string    msg     404 message string
 * @param   object    url     url object
 */
var fourOhFour = function( res, msg, url ) {
  log.error( msg + ': ' + ( ( url != null ? url.format() : void 0 ) || 'unknown' ) );
  writeErrorHead( res, 404 );
  return finish( res, 'Not Found' );
};

/*
 * respond with a 500 response
 *
 * @param   object    res     http response object
 * @param   string    msg     404 message string
 * @param   object    url     url object
 * @param   object    err     error object to log
 */
var fiveHundred = function( res, msg, url, err ) {
  log.error( msg + ': ' + ( ( url != null ? url.format() : void 0 ) || 'unknown' ), err );
  writeErrorHead( res, 500 );
  return finish( res, 'Internal Error' );
};


/*
 * Create a duplex transformer stream to handle the necessary media transformations
 * @param     object    options             processing options
 */
var transformMedia = function( options ) {
  var sharp = require( 'sharp' );

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
 * process the given url, validating and requesting the external media asset
 *
 * @param     object    url                 url object
 * @param     object    mediaHeaders        http headers object
 * @param     object    res                 http response object
 * @param     object    options             process options
 */
var processUrl = function( url, mediaHeaders, res, options ) {
  var Protocol,
      queryPath,
      reqOptions,
      srcReq,
      redirectsLeft = options.redirect || 0;

  if ( url.host != null ) {
    if ( url.protocol === 'https:' ) {
      Protocol = Https;
    }
    else if ( url.protocol === 'http:' ) {
      Protocol = Http;
    }
    else {
      return fourOhFour( res, 'Unknown protocol', url );
    }

    queryPath = url.pathname;

    // todo: verify if query is enough or 'search' should also be checked
    if ( url.query != null ) {
      queryPath += '?' + url.query;
    }

    mediaHeaders.host = url.host;

    log.debug( mediaHeaders );

    reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: queryPath,
      headers: mediaHeaders
    };

    if ( !config.keepAlive ) {
      // opts out of connection pooling. Defaults to: Connection: close.
      reqOptions.agent = false;
    }

    srcReq = Protocol.get( reqOptions, function( srcRes ) {
      var mediaRequested,
          pendingTransform,
          transformerError = false,
          transformer,
          contentType,
          contentTypePrefix,
          contentLength,
          newHeaders,
          newUrl,
          redirectOptions;

      // media is always requested at this point
      mediaRequested = true;

      pendingTransform = ( _.size( options.transform ) > 0 &&
                           config.transformTypes.indexOf( srcRes.headers[ 'content-type' ] ) > 0 ) ? true : false;


      log.debug( srcRes.headers );

      contentLength = srcRes.headers[ 'content-length' ];

      // test content length limit
      if ( contentLength > config.lengthLimit ) {
        srcRes.destroy();
        return fourOhFour( res, 'Content-Length exceeded', url );
      }
      else {
        srcRes.on( 'end', function() {
          // log.debug( '>>> srcRes end event triggered' );
          if ( mediaRequested && ( !pendingTransform && !transformerError ) ) {
            // log.debug( '>>> finishing the main res because of srcRes end event' );
            return finish( res );
          }
        } );

        srcRes.on( 'error', function() {
          // log.debug( '>>> srcRes error event triggered' );
          if ( mediaRequested ) {
            // log.debug( '>>> finishing the main res because of srcRes error event' );
            return finish( res );
          }
        } );

        if ( pendingTransform ) {
          try {
            transformer = transformMedia( options.transform );

            transformer.on( 'end', function() {
              // log.debug( '>>> transformer end event triggered' );
              pendingTransform = false;
              if ( mediaRequested && !transformerError ) {
                // log.debug( '>>> finishing the main res because of transformer end event' );
                return finish( res );
              }
            } );

            transformer.on( 'error', function() {
              log.error( 'failed transforming image', { 'reqUrl': options.reqUrl, 'assetUrl': url.format() } );
              // log.debug( '>>> transformer error event triggered' );
              pendingTransform = false;
              transformerError = true;
              // log.debug( '>>> destroying srcRes stream because of transformer error event' );
              srcRes.destroy();
              if ( config.transformRedirectOnError ) {
                var redirectUrl = Url.parse( options.reqUrl, true );

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
                return finish( res );
              }
              else {
                // log.debug( '>>> returning a 500 because of transformer error event' );
                return fiveHundred( res, 'Failed transforming media', url, options.transform );
              }
            } );
          }
          catch( e ) {
            log.error( e, { 'req': reqOptions, 'transform': options.transform } );
          }
        }

        newHeaders = {
          'content-type': srcRes.headers[ 'content-type' ],
          'cache-control': srcRes.headers[ 'cache-control' ] || 'public, max-age=31536000',
          'X-Frame-Options': config.defaultHeaders[ 'X-Frame-Options' ],
          'X-XSS-Protection': config.defaultHeaders[ 'X-XSS-Protection' ],
          'X-Content-Type-Options': config.defaultHeaders[ 'X-Content-Type-Options' ],
          'Content-Security-Policy': config.defaultHeaders[ 'Content-Security-Policy' ],
          'Strict-Transport-Security': config.defaultHeaders[ 'Strict-Transport-Security' ]
        };
        newHeaders[ 'X-' +
                    config.name.charAt( 0 ).toUpperCase() +
                    config.name.slice( 1 ).toLowerCase() + 
                    '-Host' ] = config.host;

        if ( srcRes.headers[ 'etag' ] ) {
          newHeaders[ 'etag' ] = srcRes.headers[ 'etag' ];
        }

        if( srcRes.headers[ 'expires' ] ) {
          newHeaders[ 'expires' ] = srcRes.headers[ 'expires' ];
        }

        if ( srcRes.headers[ 'last-modified' ] ) {
          newHeaders['last-modified'] = srcRes.headers[ 'last-modified' ];
        }

        if ( config.timingOrigin ) {
          newHeaders[ 'Timing-Allow-Origin' ] = config.timingOrigin;
        }

        // don't set the content-length if a transformation pending
        if ( !pendingTransform && contentLength != null ) {
          newHeaders[ 'content-length' ] = contentLength;
        }

        if ( srcRes.headers[ 'transfer-encoding' ] ) {
          newHeaders[ 'transfer-encoding' ] = srcRes.headers[ 'transfer-encoding' ];
        }

        if ( srcRes.headers[ 'content-encoding' ] ) {
          newHeaders[ 'content-encoding' ] = srcRes.headers[ 'content-encoding' ];
        }

        switch ( srcRes.statusCode ) {
          // redirect (permanent or temporary)
          case 301:
          case 302:
          case 303:
          case 307:
          case 308:
            srcRes.destroy();
            if ( redirectsLeft <= 0 ) {
              return fourOhFour( res, 'Exceeded max depth', url );
            }
            else if ( !srcRes.headers[ 'location' ] ) {
              return fourOhFour( res, 'Redirect with no location', url );
            }
            else {
              isFinished = false;

              newUrl = Url.parse( srcRes.headers[ 'location' ] );
              if ( !( ( newUrl.host != null ) && ( newUrl.hostname != null ) ) ) {
                newUrl.host = newUrl.hostname = url.hostname;
                newUrl.protocol = url.protocol;
              }
              log.debug( 'Redirected to ' + ( newUrl.format() ) );
              redirectOptions = _.clone( options );
              redirectOptions.redirect = redirectsLeft - 1;
              return processUrl( newUrl, mediaHeaders, res, redirectOptions );
            }
            break;
          // not modified (conditional requests)
          case 304:
            srcRes.destroy();
            return res.writeHead( srcRes.statusCode, newHeaders );
            break;
          // anything else
          default:
            contentType = newHeaders[ 'content-type' ];
            if ( contentType == null ) {
              srcRes.destroy();
              fourOhFour( res, 'No content-type returned', url );
              return;
            }
            contentTypePrefix = contentType.split( ';' )[ 0 ].toLowerCase();
            if ( config.validTypes.indexOf( contentTypePrefix ) < 0 ) {
              srcRes.destroy();
              fourOhFour( res, 'Non-Image content-type returned \'' + contentTypePrefix + '\'', url );
              return;
            }
            log.debug( newHeaders );

            res.writeHead( srcRes.statusCode, newHeaders );

            if ( transformer ) {
              return srcRes.pipe( transformer ).pipe( res );
            }
            else {
              return srcRes.pipe( res );
            }
        }
      }
    } );

    srcReq.setTimeout( config.socketTimeout * 1000, function() {
      // log.debug( '>>> srcReq socket timeout triggered - will abort srcReq' );
      srcReq.abort();
      // log.debug( '>>> will return a 404' );
      return fourOhFour( res, 'Socket timeout', url );
    } );

    srcReq.on( 'error', function( err ) {
      // log.debug( '>>> srcReq error event triggered - will return 404' );
      return fourOhFour( res, 'Client Request error ' + err.stack, url );
    } );

    res.on( 'close', function() {
      // log.debug( '>>> res close event triggered - will abort the srcReq' );
      log.error( 'Request aborted' );
      return srcReq.abort();
    } );

    res.on( 'error', function( err ) {
      // log.debug( '>>> res error event triggered - will abort the srcReq' );
      log.error( 'Request error: ' + err );
      return srcReq.abort();
    } );

    return;
  }
  else {
    return fourOhFour( res, 'No host found ' + url.host, url );
  }
};

/*
 * decodes a url from hexdec to string
 *
 * @param     string    str       hexdec string to be decoded
 * @returns   string              string url decoded
 */
var decodeUrl = function( str ) {
  var decoded;

  if ( str && str.length > 0 && str.length % 2 === 0 && !str.match( /[^0-9a-f]/ ) ) {
    try {
      return new Buffer( str, 'hex' ).toString();
    }
    catch( err ) {
      log.error( 'error decoding url: ' + str );
    }
  }

  return decoded;
};

/*
 * parse string collecting media transformation options
 * string should be the format key_value,key_value,key_value
 *
 * @param     string    str       string to parse
 * @returns   object              transformation object
 */
var getTransformOptions = function( str ) {
  var transform,
      strList;

  strList = str.split( ',' );
  if ( strList.length > 0 ) {
    strList.forEach( function( e ) {
      var item = e.split( '_' );
      if ( config.transformOptions.indexOf( item[ 0 ] ) >= 0 ) {
        transform = transform || {};
        transform[ item[ 0 ] ] = item[ 1 ];
      }
    } );
  }
  return transform;
};

/*
 * process a get request to an external media asset
 *
 * @param   object    req       http request object
 * @param   object    res       http response object
 */
module.exports.processRequest = function( req, res ) {
  var url,
      mediaHeaders,
      mediaTransform,
      parts,
      signature,
      reqSignature,
      encodedUrl,
      destUrl,
      urlType,
      hmac;

  url = Url.parse( req.url );

  mediaHeaders = {
    'Via': config.proxyAgent,
    'User-Agent': ( req.headers[ 'user-agent' ] != null ? req.headers[ 'user-agent' ] : 'unknown' ),
    'Accept': ( req.headers.accept != null ? req.headers.accept : 'image/*' ),
    'Accept-Encoding': ( req.headers[ 'accept-encoding' ] != null ? req.headers[ 'accept-encoding' ] : 'unknown' ),
    'X-Frame-Options': config.defaultHeaders[ 'X-Frame-Options' ],
    'X-XSS-Protection': config.defaultHeaders[ 'X-XSS-Protection' ],
    'X-Content-Type-Options': config.defaultHeaders[ 'X-Content-Type-Options' ],
    'Content-Security-Policy': config.defaultHeaders[ 'Content-Security-Policy' ]
  };

  // no need for cookies
  delete req.headers.cookie;

  parts = url.pathname.replace( /^\//, '' ).split( '/' );
  reqSignature = parts[ 0 ];
  encodedUrl = parts[ 1 ];

  destUrl = decodeUrl( encodedUrl );

  var qs = QueryString.parse( url.query );

  // the code supports both path or querystring style requests
  if ( destUrl ) {
    urlType = 'path';
  }
  else if ( qs.url ) {
    urlType = 'query';
    destUrl = qs.url;
  }
  else {
    return fourOhFour( res, 'missing required media url' );
  }

  // try to decode options through the url
  if ( parts[ 2 ] ) {
    mediaTransform = getTransformOptions( parts[ 2 ] );
  }

  // fallback to get media transformation through query string
  if ( !mediaTransform ) {
    mediaTransform = _.pick( qs, config.transformOptions );
  }

  log.debug( {
    type: urlType,
    url: req.url,
    headers: req.headers,
    dest: destUrl,
    reqSignature: reqSignature,
    transform: mediaTransform
  } );

  // avoid looping requests
  if ( req.headers[ 'via' ] && req.headers[ 'via' ].indexOf( config.proxyAgent ) !== -1 ) {
    return fourOhFour( res, 'Requesting from self' );
  }

  // checking url.pathname since signature is mandatory as pathname
  if ( ( url.pathname != null ) && destUrl ) {
    hmac = Crypto.createHmac( 'sha1', config.proxyKey );
    try {
      hmac.update( destUrl, 'utf8' );
    }
    catch ( err ) {
      log.error( 'could not create signature', err );
      return fourOhFour( res, 'could not create signature' );
    }
    signature = hmac.digest( 'hex' );
    if ( signature === reqSignature ) {
      // url = Url.parse( destUrl );
      return processUrl( Url.parse( destUrl ), mediaHeaders, res, { 'redirects': config.maxRedirects, 'transform': mediaTransform, 'reqUrl': url.format() } );
    }
    else {
      return fourOhFour( res, 'signature mismatch: ' + signature + ' | ' + reqSignature );
    }
  }
  else {
    return fourOhFour( res, 'No pathname provided on the server' );
  }
};
