'use strict';

var config = require( './config' );

// can be set to: 'disabled' (no logs), 'debug' (all logs), 'dev' (warns and errors), 'prod' (only errors)

/*
 * writes the message to the console if log is configured to debug
 *
 * @param   string    msg    message string to be logged [optional]
 * @param   mixed     obj    string/object message to be logged
 */
module.exports.debug = function( msg, obj ) {
  if ( config.log === 'debug' ) {
    if ( !msg && !obj ) {
      return;
    }

    if ( msg && !obj ) {
      msg = obj;
      msg = null;
    }

    if ( msg ) {
      console.log( '|> ' + msg );
    }
    console.log( '--------------------------------------------' );
    console.log( obj );
    console.log( '--------------------------------------------');
  }
  return;
};

var out = function( type, msg, obj ) {
  console[ type ]( '[' + ( new Date().toISOString() ) + '] ' + msg );
  if ( obj ) {
    console.log( JSON.stringify( obj ) );
  }
};

/*
 * writes the message to the console (as warn message) if log is verbose
 *
 * @param   string    msg     string message to be logged
 * @param   object    obj     object with extra info on the error
 */
module.exports.warn = function( msg, obj ) {
	if ( config.log === 'debug' || config.log === 'dev' ) {
    out( 'warn', msg, obj );
  }
  return;
};

/*
 * writes the message to the console (as error message) if log is not disabled
 *
 * @param   string    msg     string message to be logged
 * @param   object    obj     object with extra info on the error
 */
module.exports.error = function( msg, obj ) {
  if ( config.log === 'debug' || config.log === 'dev' || config.log === 'prod' ) {
    out( 'error', msg, obj );
  }
  return;
};
