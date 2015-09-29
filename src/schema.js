'use strict';

// built-in/third-party modules

// custom modules
var log         = require( './log' );


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
      log.warn( 'error decoding url: ' + str );
    }
  }

  return decoded;
};
module.exports.decodeUrl = decodeUrl;
