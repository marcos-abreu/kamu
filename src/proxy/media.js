'use strict';

// built-in/third-party modules
var QueryString = require( 'querystring' );

// custom modules
var config      = require( '../config' ),
    log         = require( '../log' ),
    utils       = require( '../utils' );

/*
 * collects information necessary to request the media asset
 *
 * @param     object    headers     media headers object
 * @param     object    url         main request url object
 * @returns   object                media request options object
 */
var reqOptions = function( headers, url ) {
  var options,
      mediaPath = url.pathname,
      mediaQS = utils.getQS( url );

  if ( mediaQS ) {
    mediaPath += ( '?' + QueryString.stringify( mediaQS ) );
  }

  headers.host = url.host;

  options = {
    hostname: url.hostname,
    port: url.port,
    path: mediaPath,
    headers: headers
  };

  if ( !config.keepAlive ) {
    // opts out of connection pooling. Defaults to: Connection: close.
    options.agent = false;
  }

  log.debug( 'media request options', options );
  return options;
};
module.exports.reqOptions = reqOptions;
