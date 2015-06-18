'use strict';

// built-in/third-party modules
var Http        = require( 'http' );

// custom modules
var config      = require( './proxy/config' ),
    connStatus  = require( './proxy/connection-status' ),
    proxy       = require( './proxy' );

// start tracking connections
connStatus.start();

var server = Http.createServer( function( req, res ) {
  // only get requests with a url pathname
  if ( req.method !== 'GET' || req.url === '/' ) {
    res.writeHead( 200, config.defaultHeaders );
    return res.end( 'hwhat' );
  }
  // favicon requests will get a straight response
  else if ( req.url === '/favicon.ico' ) {
    res.writeHead( 200, config.defaultHeaders );
    return res.end( 'ok' );
  }
  // status request will give you the amount of connections
  else if ( req.url === '/status' ) {
    res.writeHead( 200, config.defaultHeaders );
    return res.end( 'ok: ' + connStatus.toString() );
  }
  // if the request passed the first set of filters than process the request
  else {
    connStatus.open();
    return proxy.processRequest( req, res );
  }
} );

// log indicating that the server is ready to receive requests
console.log( config.name + ' ssl image proxy running on ' + config.port + ' ' +
             'with pid: ' + process.pid + ' ' +
             'version:' + config.version + '.' );

// start listening for requests
server.listen( config.port );
