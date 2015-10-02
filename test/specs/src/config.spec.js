'use strict';

require( '../../common' );

var path = require( 'path' );

describe( 'config', function() {
  var packageInfo,
      config;

  before( function() {
    packageInfo = require( path.resolve( __dirname, '../../../', 'package.json' ) );
    config = rewire( '../src/config' );
  } );

  it( 'should expose name as the app package name' ,function() {
    expect( config.name ).to.be.equal( packageInfo.name );
  } );

  it( 'should expose version as the app package version', function() {
    expect( config.version ).to.be.equal( packageInfo.version );
  } );

  describe( 'when environment key is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_KEY = 'custom key';
    } );

    after( function() {
      process.env.KAMU_KEY = void 0;
    } );

    it( 'should expose the environment key', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.proxyKey ).to.be.equal( 'custom key' );
    } );
  } );

  describe( 'when environment key is NOT defined', function() {
    it( 'should expose the default key', function() {
      expect( config.proxyKey ).to.be.equal( '0xF6D61696E2E636F6D2F736' );
    } );
  } );

  describe( 'when environment logging is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_LOGGING = 'prod';
    } );

    after( function() {
      process.env.KAMU_LOGGING = void 0;
    } );

    it( 'should expose the environment logging', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.log ).to.be.equal( 'prod' );
    } );

  } );

  describe( 'when environment logging is NOT defined', function() {
    it( 'should expose the default logging', function() {
      expect( config.log ).to.be.equal( 'disabled' );
    } );
  } );

  describe( 'when environment host is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_HOST = 'custom host';
    } );

    after( function() {
      process.env.KAMU_HOST = void 0;
    } );

    it( 'should expose the environment host', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.host ).to.be.equal( 'custom host' );
    } );
  } );

  describe( 'when environment host is NOT defined', function() {
    it( 'should expose the default host', function() {
      expect( config.host ).to.be.equal( 'https://www.media-proxy.com' );
    } );
  } );

  describe( 'when environment port is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_PORT = 9999;
    } );

    after( function() {
      process.env.KAMU_PORT = void 0;
    } );

    it( 'should expose the environment port', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.port ).to.be.equal( 9999 );
    } );
  } );

  describe( 'when environment port is NOT defined', function() {
    it( 'should expose the default port', function() {
      expect( config.port ).to.be.equal( 8081 );
    } );
  } );

  describe( 'when environment proxy agent is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_AGENT = 'custom agent';
    } );

    after( function() {
      process.env.KAMU_AGENT = void 0;
    } );

    it( 'should expose the environment proxy agent', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.proxyAgent ).to.be.equal( 'custom agent' );
    } );
  } );

  describe( 'when environment proxy agent is NOT defined', function() {
    it( 'should expose the default proxy agent', function() {
      expect( config.proxyAgent ).to.be.equal( 'kamu.asset.proxy-' + packageInfo.version );
    } );
  } );

  describe( 'when environment maximum redirects is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_REDIRECTS = 999;
    } );

    after( function() {
      process.env.KAMU_REDIRECTS = void 0;
    } );

    it( 'should expose the environment maximum redirects', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.maxRedirects ).to.be.equal( 999 );
    } );
  } );

  describe( 'when environment maximum redirects is NOT defined', function() {
    it( 'should expose the default maximum redirects', function() {
      expect( config.maxRedirects ).to.be.equal( 4 );
    } );
  } );

  describe( 'when environment maximum waiting time is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_TIMEOUT = 999;
    } );

    after( function() {
      process.env.KAMU_TIMEOUT = void 0;
    } );

    it( 'should expose the environment maximum waiting time', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.socketTimeout ).to.be.equal( 999 );
    } );
  } );

  describe( 'when environment maximum waiting time is NOT defined', function() {
    it( 'should expose the default maximum waiting time', function() {
      expect( config.socketTimeout ).to.be.equal( 10 );
    } );
  } );

  describe( 'when environment keep alive is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_KEEP_ALIVE = true;
    } );

    after( function() {
      process.env.KAMU_KEEP_ALIVE = void 0;
    } );

    it( 'should expose the environment keep alive', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.keepAlive ).to.be.equal( true );
    } );
  } );

  describe( 'when environment keep alive is NOT defined', function() {
    it( 'should expose the default keep alive', function() {
      expect( config.keepAlive ).to.be.equal( false );
    } );
  } );

  describe( 'when environment timing origin is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_TIMINGS = 'custom timings';
    } );

    after( function() {
      process.env.KAMU_TIMINGS = void 0;
    } );

    it( 'should expose the environment timing origin', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.timingOrigin ).to.be.equal( 'custom timings' );
    } );
  } );

  describe( 'when environment timing origin is NOT defined', function() {
    it( 'should expose the default timing origin', function() {
      expect( config.timingOrigin ).to.be.equal( false );
    } );
  } );

  describe( 'when environment length limit is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_LENGTH = 999999999;
    } );

    after( function() {
      process.env.KAMU_LENGTH = void 0;
    } );

    it( 'should expose the environment length limit', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.lengthLimit ).to.be.equal( 999999999 );
    } );
  } );

  describe( 'when environment length limit is NOT defined', function() {
    it( 'should expose the default length limit', function() {
      expect( config.lengthLimit ).to.be.equal( 5242880 ); // 5mb
    } );
  } );

  it( 'should expose valid asset types based on the mime-types.json', function() {
    var types = require( path.resolve( __dirname, '../../../', 'mime-types.json' ) );
    expect( config.validTypes ).to.be.deep.equal( types );
    expect( config.validTypes ).to.be.an.array;
  } );

  it( 'should expose valid transform content types', function() {
    expect( config.transformTypes ).to.be.an.array;
    expect( config.transformTypes.length ).to.be.equal( 5 );
  } );

  describe( 'when environment transform without enlargement is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_TRANSFORM_WITHOUT_ENLARGEMENT = false;
    } );

    after( function() {
      process.env.KAMU_TRANSFORM_WITHOUT_ENLARGEMENT = void 0;
    } );

    it( 'should expose the environment value', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.transformWithoutEnlargement ).to.be.equal( false );
    } );
  } );

  describe( 'when environment transform without enlargement is NOT defined', function() {
    it( 'should expose the default transform without enlargement', function() {
      expect( config.transformWithoutEnlargement ).to.be.equal( true );
    } );
  } );

  it( 'should expose the valid transform formats', function() {
    expect( config.transformFormats ).to.be.an.array;
    expect( config.transformFormats.length ).to.be.equal( 4 );
  } );

  it( 'should expose the valid transform angles', function() {
    expect( config.transformAngles ).to.be.an.array;
    expect( config.transformAngles.length ).to.be.equal( 4 );
  } );

  it( 'should expose the valid transform gravity', function() {
    expect( config.transformGravity ).to.be.an.array;
    expect( config.transformGravity.length ).to.be.equal( 6 );
  } );

  it( 'should expose the valid transform options', function() {
    expect( config.transformOptions ).to.be.an.array;
    expect( config.transformOptions.length ).to.be.equal( 13 );
  } )

  describe( 'when environment transform redirect on error is defined', function() {
    var configCustom;

    before( function() {
      process.env.KAMU_TRANS_REDIRECT_ONERROR = false;
    } );

    after( function() {
      process.env.KAMU_TRANS_REDIRECT_ONERROR = void 0;
    } );

    it( 'should expose the environment transform redirect on error', function() {
      // using rewire to avoid getting the cached module
      configCustom = rewire( '../src/config' );
      expect( configCustom.transformRedirectOnError ).to.be.equal( false );
    } );
  } );

  describe( 'when environment transform redirect on error is NOT defined', function() {
    it( 'should expose the default transform redirect on error', function() {
      expect( config.transformRedirectOnError ).to.be.equal( true );
    } );
  } );

  it( 'should expose the default safe headers', function() {
    expect( config.defaultHeaders ).to.include.keys( 'X-Frame-Options' );
    expect( config.defaultHeaders ).to.include.keys( 'X-XSS-Protection' );
    expect( config.defaultHeaders ).to.include.keys( 'X-Content-Type-Options' );
    expect( config.defaultHeaders ).to.include.keys( 'Content-Security-Policy' );
    expect( config.defaultHeaders ).to.include.keys( 'Strict-Transport-Security' );
  } );
} );
