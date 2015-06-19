'use strict';

var path          = require( 'path' ),
    gulp          = require( 'gulp' ),
    plumber       = require( 'gulp-plumber' ),
    mocha         = require( 'gulp-mocha' ),
    argv          = require( 'yargs' ).argv,
    proxyUrl      = require( './demo/utils' ).proxyUrl;

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

