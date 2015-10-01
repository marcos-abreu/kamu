'use strict';

// built-in/third-party modules
var Crypto      = require( 'crypto' ),
    Url         = require( 'url' );

// custom modules
var config      = require( './config' ),
    log         = require( './log' ),
    transform   = require( './proxy/transform' ),
    schema      = require( './schema' ),
    proxy       = require( './proxy' ),
    utils       = require( './utils' );

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

  var qs = utils.getQS( url );

  destUrl = schema.decodeUrl( encodedUrl );
  if ( destUrl ) {
    urlType = 'path';
  }
  else if ( qs && qs.url ) {
    urlType = 'query';
    destUrl = schema.decodeUrl( qs.url );
  }

  if ( !destUrl ) {
    return utils.fourOhFour( res, 'missing required media url' );
  }

  // decode processing options if available through url first
  if ( parts[ 2 ] ) {
    mediaTransform = transform.parseUrl( parts[ 2 ] );
  }

  // fallback to get options through query string
  if ( !mediaTransform ) {
    mediaTransform = transform.parseQS( qs );
  }

  log.debug( 'parameters after parsing', {
    type: urlType,
    url: req.url,
    headers: req.headers,
    dest: destUrl,
    reqSignature: reqSignature,
    transform: mediaTransform
  } );

  // avoid looping requests
  if ( req.headers[ 'via' ] && req.headers[ 'via' ].indexOf( config.proxyAgent ) !== -1 ) {
    return utils.fourOhFour( res, 'Requesting from self' );
  }

  // checking url.pathname since signature is mandatory as pathname
  if ( reqSignature ) {
    hmac = Crypto.createHmac( 'sha1', config.proxyKey );
    try {
      hmac.update( destUrl, 'utf8' );
    }
    catch ( err ) {
      log.warn( 'could not create signature', err );
      return utils.fourOhFour( res, 'could not create signature' );
    }
    signature = hmac.digest( 'hex' );
    if ( signature === reqSignature ) {
      return proxy.processUrl( Url.parse( destUrl ), mediaHeaders, res, { 'redirects': config.maxRedirects, 'transform': mediaTransform, 'reqUrl': url.format() } );
    }
    else {
      return utils.fourOhFour( res, 'signature mismatch: ' + signature + ' | ' + reqSignature );
    }
  }
  else {
    return utils.fourOhFour( res, 'No signature provided' );
  }
};