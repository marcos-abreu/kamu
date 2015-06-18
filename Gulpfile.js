'use strict';

var path          = require( 'path' ),
    gulp          = require( 'gulp' ),
    plumber       = require( 'gulp-plumber' ),
    mocha         = require( 'gulp-mocha' ),
    argv          = require( 'yargs' ).argv;

gulp.task( 'test', function() {
  return gulp.src( path.resolve( __dirname, 'test/**/*.spec.js' ), { read: false } )
    .pipe( mocha( {
      reporter: 'dot',
      clearRequireCache: true,
      ignoreLeaks: true
    } ) );
} );


gulp.task( 'proxy', function() {
  var url = argv.url;

  if ( !url ) {
    console.log( 'missing required parameter url' );
  }
  else {
    console.log( proxyUrl( url ) );
  }

  return gulp.src( '' );
} );

/*
 * The following generates a proxy url, based on the current server configuration
 * and the provided url parameter
 */
var Crypto = require('crypto');
var config = require( './proxy/config' );

var proxyUrl = function(url) {
  var hmac,
      hmacDigest,
      urlDigest;

  hmac = Crypto.createHmac('sha1', config.proxyKey);
  hmac.update(url, 'utf8');

  hmacDigest = hmac.digest('hex');

  urlDigest = new Buffer(url).toString('hex');
  return config.host + '/' + hmacDigest + '/' + urlDigest;
};
