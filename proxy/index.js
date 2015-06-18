'use strict';

// built-in/third-party modules
var Crypto      = require( 'crypto' ),
    Http        = require( 'http' ),
    Https       = require( 'https' ),
    QueryString = require( 'querystring' ),
    Url         = require( 'url' );

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
  return res.connection && res.end( str );
};

/*
 * respond with a 404 to a request
 *
 * @param   object    res     http response object
 * @param   string    msg     404 message string
 * @param   object    url     url object
 */
var fourOhFour = function( res, msg, url ) {
  log.error( msg + ': ' + ( ( url != null ? url.format() : void 0 ) || 'unknown' ) );
  res.writeHead( 404, {
    'expires': '0',
    'Cache-Control': 'no-cache, no-store, private, must-revalidate',
    'X-Frame-Options': config.defaultHeaders[ 'X-Frame-Options' ],
    'X-XSS-Protection': config.defaultHeaders[ 'X-XSS-Protection' ],
    'X-Content-Type-Options': config.defaultHeaders[ 'X-Content-Type-Options' ],
    'Content-Security-Policy': config.defaultHeaders[ 'Content-Security-Policy' ],
    'Strict-Transport-Security': config.defaultHeaders[ 'Strict-Transport-Security' ]
  } );

  return finish( res, 'Not Found' );
};

/*
 * process the given url, validating and requesting the external media asset
 *
 * @param     object    url                 url object
 * @param     object    mediaHeaders        http headers object
 * @param     object    res                 http response object
 * @param     integer   redirectsLeft       number of remaining redirects allowed
 */
var processUrl = function( url, mediaHeaders, res, redirectsLeft ) {
  var Protocol,
      queryPath,
      reqOptions,
      srcReq;

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
      var isFinished,
          contentType,
          contentTypePrefix,
          contentLength,
          newHeaders,
          newUrl;

      isFinished = true;

      log.debug( srcRes.headers );

      contentLength = srcRes.headers[ 'content-length' ];

      // test content length limit
      if ( contentLength > config.lengthLimit ) {
        srcRes.destroy();
        return fourOhFour( res, 'Content-Length exceeded', url );
      }
      else {
        srcRes.on( 'end', function() {
          if ( isFinished ) {
            return finish( res );
          }
        } );

        srcRes.on( 'error', function() {
          if ( isFinished ) {
            return finish( res );
          }
        } );

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

        if ( contentLength != null ) {
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
              return processUrl( newUrl, mediaHeaders, res, redirectsLeft - 1 );
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
            return srcRes.pipe( res );
        }
      }
    } );

    srcReq.setTimeout( config.socketTimeout * 1000, function() {
      srcReq.abort();
      return fourOhFour( res, 'Socket timeout', url );
    } );

    srcReq.on( 'error', function( err ) {
      return fourOhFour( res, 'Client Request error ' + err.stack, url );
    } );

    res.on( 'close', function() {
      log.error( 'Request aborted' );
      return srcReq.abort();
    } );

    res.on( 'error', function( err ) {
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
 * process a get request to an external media asset
 *
 * @param   object    req       http request object
 * @param   object    res       http response object
 */
module.exports.processRequest = function( req, res ) {
  var url,
      mediaHeaders,
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
    'Accept-Encoding': req.headers[ 'accept-encoding' ],
    'X-Frame-Options': config.defaultHeaders[ 'X-Frame-Options' ],
    'X-XSS-Protection': config.defaultHeaders[ 'X-XSS-Protection' ],
    'X-Content-Type-Options': config.defaultHeaders[ 'X-Content-Type-Options' ],
    'Content-Security-Policy': config.defaultHeaders[ 'Content-Security-Policy' ]
  };

  // no need for cookies
  delete req.headers.cookie;

  parts = url.pathname.replace( /^\//, '' ).split( '/', 2 );
  reqSignature = parts[ 0 ];
  encodedUrl = parts[ 1 ];

  destUrl = decodeUrl( encodedUrl );

  // the code supports both path or querystring style requests
  if ( destUrl ) {
    urlType = 'path';
  }
  else {
    urlType = 'query';
    destUrl = QueryString.parse( url.query ).url;
  }

  log.debug( {
    type: urlType,
    url: req.url,
    headers: req.headers,
    dest: destUrl,
    reqSignature: reqSignature
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
      url = Url.parse( destUrl );
      return processUrl( url, mediaHeaders, res, config.maxRedirects );
    }
    else {
      return fourOhFour( res, 'signature mismatch: ' + signature + ' | ' + reqSignature );
    }
  }
  else {
    return fourOhFour( res, 'No pathname provided on the server' );
  }
};
