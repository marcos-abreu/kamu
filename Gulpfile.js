'use strict';

var path          = require( 'path' ),
    gulp          = require( 'gulp' ),
    plumber       = require( 'gulp-plumber' ),
    mocha         = require( 'gulp-mocha' ),
    argv          = require( 'yargs' ).argv,
    runSequence   = require( 'run-sequence' ),
    proxyUrl      = require( './demo/utils' ).proxyUrl,
    config        = require( './proxy/config' );

gulp.task( 'test:unit', function() {
  return gulp.src( path.resolve( __dirname, 'test/specs/**/*.spec.js' ), { read: false } )
    .pipe( mocha( {
      reporter: 'dot',
      clearRequireCache: true,
      ignoreLeaks: true
    } ) );
} );

gulp.task( 'test:integration', function() {
  return gulp.src( path.resolve( __dirname, 'test/integration/**/*.js' ), { read: false } )
    .pipe( mocha( {
      reporter: 'dot',
      clearRequireCache: true,
      ignoreLeaks: true
    } ) );
} );


// gulp.task( 'test', [ 'test:unit', 'test:integration' ] );
gulp.task( 'test', function( done ) {
  runSequence( 'test:unit', 'test:integration', done );
} );

gulp.task( 'proxy', function() {
  var url   = argv.url,
      key   = argv.key,
      bkpKey,
      host  = argv.host,
      bkpHost;

  if ( !url ) {
    console.log( 'missing required parameter url\n',
                 'Usage:\n',
                 '    gulp proxy --url=http://www.external-domain.com/path/to/image.png [--key=SOMEKEY] [--host=https://samplehost.com]' );
  }
  else {

    // backup original values and set new ones
    if ( key ) {
      bkpKey = config.proxyKey;
      config.proxyKey = key;
    }
    if ( host ) {
      bkpHost = config.host;
      config.host = host;
    }

    console.log( proxyUrl( url ) );

    // revert to original values
    if ( key ) {
      config.proxyKey = bkpKey;
    }
    if ( host ) {
      config.host = bkpHost;
    }
  }

  return gulp.src( '' );
} );

