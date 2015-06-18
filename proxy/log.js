'use strict';

var config = require( './config' );

/*
 * writes the message to the console if log is configured to debug
 *
 * @param   string    msg     string message to be logged
 */
module.exports.debug = function( msg ) {
  if ( config.log === 'debug' ) {
    console.log( '--------------------------------------------' );
    console.log( msg );
    console.log( '--------------------------------------------');
  }
  return;
};

/*
 * writes the message to the console (as error message) if log is not disabled
 *
 * @param   string    msg     string message to be logged
 */
module.exports.error = function( msg ) {
  if ( config.log !== 'disabled' ) {
    console.error( '[' + ( new Date().toISOString() ) + '] ' + msg );
  }
  return;
};
