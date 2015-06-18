'use strict';

require( '../common' );

var path = require( 'path' );

describe( 'config module', function() {
  var packageInfo,
      config;

  before( function() {
    packageInfo = require( path.resolve( __dirname, '../../', 'package.json' ) );
    config = rewire( '../proxy/config' );
  } );

  it( 'should expose name as the app package name' ,function() {
    expect( config.name ).to.be.equal( packageInfo.name );
  } );

  it( 'should expose version as the app package version', function() {
    expect( config.version ).to.be.equal( packageInfo.version );
  } );

  describe( 'when environment key is defined', function() {
    it.skip( 'should expose the environment key', function() {

    } );
  } );

  describe( 'when environment key is NOT defined', function() {
    it( 'should expose the default key', function() {
      expect( config.proxyKey ).to.be.equal( '0xF6D61696E2E636F6D2F736' );
    } );
  } );

  describe( 'when environment logging is defined', function() {
    it.skip( 'should expose the environment logging', function() {

    } );
  } );

  describe( 'when environment logging is NOT defined', function() {
    it( 'should expose the default logging', function() {
      expect( config.log ).to.be.equal( 'disabled' );
    } );
  } );

  describe( 'when environment host is defined', function() {
    it.skip( 'should expose the environment host', function() {

    } );
  } );

  describe( 'when environment host is NOT defined', function() {
    it( 'should expose the default host', function() {
      expect( config.host ).to.be.equal( 'https://www.media-proxy.com' );
    } );
  } );

  describe( 'when environment port is defined', function() {
    it.skip( 'should expose the environment port', function() {

    } );
  } );

  describe( 'when environment port is NOT defined', function() {
    it( 'should expose the default port', function() {
      expect( config.port ).to.be.equal( 8081 );
    } );
  } );

  describe( 'when environment proxy agent is defined', function() {
    it.skip( 'should expose the environment proxy agent', function() {

    } );
  } );

  describe( 'when environment proxy agent is NOT defined', function() {
    it( 'should expose the default proxy agent', function() {
      expect( config.proxyAgent ).to.be.equal( 'kamu.asset.proxy-' + packageInfo.version );
    } );
  } );

  describe( 'when environment maximum redirects is defined', function() {
    it.skip( 'should expose the environment maximum redirects', function() {

    } );
  } );

  describe( 'when environment maximum redirects is NOT defined', function() {
    it( 'should expose the default maximum redirects', function() {
      expect( config.maxRedirects ).to.be.equal( 4 );
    } );
  } );

  describe( 'when environment maximum waiting time is defined', function() {
    it.skip( 'should expose the environment maximum waiting time', function() {

    } );
  } );

  describe( 'when environment maximum waiting time is NOT defined', function() {
    it( 'should expose the default maximum waiting time', function() {
      expect( config.socketTimeout ).to.be.equal( 10 );
    } );
  } );

  describe( 'when environment keep alive is defined', function() {
    it.skip( 'should expose the environment keep alive', function() {

    } );
  } );

  describe( 'when environment keep alive is NOT defined', function() {
    it( 'should expose the default keep alive', function() {
      expect( config.keepAlive ).to.be.equal( false );
    } );
  } );

  describe( 'when environment timing origin is defined', function() {
    it.skip( 'should expose the environment timing origin', function() {

    } );
  } );

  describe( 'when environment timing origin is NOT defined', function() {
    it( 'should expose the default timing origin', function() {
      expect( config.timingOrigin ).to.be.equal( false );
    } );
  } );

  describe( 'when environment length limit is defined', function() {
    it.skip( 'should expose the environment length limit', function() {

    } );
  } );

  describe( 'when environment length limit is NOT defined', function() {
    it( 'should expose the default length limit', function() {
      expect( config.lengthLimit ).to.be.equal( 5242880 ); // 5mb
    } );
  } );

  it( 'should expose valid asset types based on the mime-types.json', function() {
    var types = require( path.resolve( __dirname, '../../', 'mime-types.json' ) );
    expect( config.validTypes ).to.be.deep.equal( types );
  } );

  it( 'should expose the default safe headers', function() {
    expect( config.defaultHeaders ).to.include.keys( 'X-Frame-Options' );
    expect( config.defaultHeaders ).to.include.keys( 'X-XSS-Protection' );
    expect( config.defaultHeaders ).to.include.keys( 'X-Content-Type-Options' );
    expect( config.defaultHeaders ).to.include.keys( 'Content-Security-Policy' );
    expect( config.defaultHeaders ).to.include.keys( 'Strict-Transport-Security' );
  } );
} );
