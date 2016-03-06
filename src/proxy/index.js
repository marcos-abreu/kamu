'use strict';

// built-in/third-party modules
var Http        = require( 'http' ),
    Https       = require( 'https' ),
    Url         = require( 'url' ),
    _           = require( 'lodash' );

// custom modules
var config      = require( '../config' ),
    log         = require( '../log' ),
    utils       = require( '../utils' ),
    media       = require( './media' ),
    transform   = require( './transform' );

/*
 * process the given url, validating and requesting the external media asset
 *
 * @param     object    url                 media url object
 * @param     object    mediaHeaders        http headers object
 * @param     object    res                 http response object
 * @param     object    options             process options
 */
var processUrl = function( url, mediaHeaders, res, options ) {
  var Protocol,
      mediaReqOptions,
      mediaReq,
      redirectsLeft = options.redirects || 0;

  if ( url.host != null ) {
    Protocol = url.protocol === 'https:' ? Https : url.protocol === 'http:' ? Http : null;
    if ( !Protocol ) {
      return utils.fourOhFour( res, 'Unknown protocol', url );
    }

    mediaReqOptions = media.reqOptions( mediaHeaders, url );

    mediaReq = Protocol.get( mediaReqOptions, function( mediaRes ) {
      var transformer,
          contentType,
          contentTypePrefix,
          contentLength,
          newHeaders,
          newUrl,
          redirectOptions;

      log.debug( 'media response headers', mediaRes.headers );

      // set the necessary flags
      res._media = res._media || {};
      res._media.finished = true;
      res._media.pendingTransform = ( _.size( options.transform ) > 0 &&
                                      config.transformTypes.indexOf( mediaRes.headers[ 'content-type' ].split( ';' )[ 0 ].toLowerCase() ) >= 0 )
      res._media.transformError = false;

      log.debug( 'media response flags', {
        requested: res._media.finished,
        pendingTransform: res._media.pendingTransform,
        transformError: res._media.transformError
      } );

      // test content length limit
      contentLength = mediaRes.headers[ 'content-length' ];
      if ( contentLength > config.lengthLimit ) {
        mediaRes.destroy();
        return utils.fourOhFour( res, 'Content-Length exceeded', url );
      }
      else {
        mediaRes.on( 'end', function() {
          if ( res._media.finished && ( !res._media.pendingTransform && !res._media.transformError ) ) {
            return utils.finish( res );
          }
        } );

        mediaRes.on( 'error', function() {
          if ( res._media.finished ) {
            return utils.finish( res );
          }
        } );

        if ( res._media.pendingTransform ) {
          transformer = transform.getTransformer( res, mediaRes, options.transform, options.reqUrl, url.format() );
        }

        newHeaders = {
          'content-type': mediaRes.headers[ 'content-type' ],
          'cache-control': mediaRes.headers[ 'cache-control' ] || 'public, max-age=31536000',
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

        if ( mediaRes.headers[ 'etag' ] ) {
          newHeaders[ 'etag' ] = mediaRes.headers[ 'etag' ];
        }

        if( mediaRes.headers[ 'expires' ] ) {
          newHeaders[ 'expires' ] = mediaRes.headers[ 'expires' ];
        }

        if ( mediaRes.headers[ 'last-modified' ] ) {
          newHeaders['last-modified'] = mediaRes.headers[ 'last-modified' ];
        }

        if ( config.timingOrigin ) {
          newHeaders[ 'Timing-Allow-Origin' ] = config.timingOrigin;
        }

        // don't set the content-length if a transformation pending
        if ( !res._media.pendingTransform && contentLength != null ) {
          newHeaders[ 'content-length' ] = contentLength;
        }

        if ( mediaRes.headers[ 'transfer-encoding' ] ) {
          newHeaders[ 'transfer-encoding' ] = mediaRes.headers[ 'transfer-encoding' ];
        }

        if ( mediaRes.headers[ 'content-encoding' ] ) {
          newHeaders[ 'content-encoding' ] = mediaRes.headers[ 'content-encoding' ];
        }

        switch ( mediaRes.statusCode ) {
          // redirect (permanent or temporary)
          case 301:
          case 302:
          case 303:
          case 307:
          case 308:
            mediaRes.destroy();
            if ( redirectsLeft <= 0 ) {
              return utils.fourOhFour( res, 'Exceeded max depth', url );
            }
            else if ( !mediaRes.headers[ 'location' ] ) {
              return utils.fourOhFour( res, 'Redirect with no location', url );
            }
            else {
              res._media.finished = false;

              newUrl = Url.parse( mediaRes.headers[ 'location' ] );
              if ( !( ( newUrl.host != null ) && ( newUrl.hostname != null ) ) ) {
                newUrl.host = newUrl.hostname = url.hostname;
                newUrl.protocol = url.protocol;
              }
              log.debug( 'Redirected to ' + ( newUrl.format() ) );
              redirectOptions = _.clone( options );
              redirectOptions.redirects = redirectsLeft - 1;
              return processUrl( newUrl, mediaHeaders, res, redirectOptions );
            }
            break;
          // not modified (conditional requests)
          case 304:
            mediaRes.destroy();
            return res.writeHead( mediaRes.statusCode, newHeaders );
            break;
          // anything else
          default:
            contentType = newHeaders[ 'content-type' ];
            if ( contentType == null ) {
              mediaRes.destroy();
              utils.fourOhFour( res, 'No content-type returned', url );
              return;
            }
            contentTypePrefix = contentType.split( ';' )[ 0 ].toLowerCase();
            if ( config.validTypes.indexOf( contentTypePrefix ) < 0 ) {
              mediaRes.destroy();
              utils.fourOhFour( res, 'Non-Image content-type returned \'' + contentTypePrefix + '\'', url );
              return;
            }
            log.debug( 'main response headers', newHeaders );

            res.writeHead( mediaRes.statusCode, newHeaders );

            if ( transformer ) {
              return mediaRes.pipe( transformer ).pipe( res );
            }
            else {
              return mediaRes.pipe( res );
            }
        }
      }
    } );

    mediaReq.setTimeout( config.socketTimeout * 1000, function() {
      mediaReq.abort();
      return utils.fourOhFour( res, 'Media request socket timeout', url );
    } );

    mediaReq.on( 'error', function( err ) {
      mediaReq.abort();
      // // fourOhFour don't log when on prod, but these errors are necessary to see
      // if ( config.log === 'prod' ) {
      //   error.log( 'media request error - ' + err.stack + '\nurl: ' + url );
      // }
      return utils.fourOhFour( res, 'Media request error ' + err.stack, url );
    } );

    res.on( 'close', function() {
      log.warn( 'Request aborted' );
      return mediaReq.abort();
    } );

    res.on( 'error', function( err ) {
      log.error( 'Request error: ' + err );
      if ( mediaReq ) {
        mediaReq.abort();
      }
      return utils.finish();
    } );

    return;
  }
  else {
    return utils.fourOhFour( res, 'No host provided by url: ' + url, url );
  }
};
module.exports.processUrl = processUrl;
