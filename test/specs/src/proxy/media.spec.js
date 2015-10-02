'use strict';

require( '../../../common' );

var Url = require( 'url' );

describe( 'proxy media', function() {
  var media;

  before( function() {
    media = rewire( '../src/proxy/media' );

    media.__set__( {
      'log'         : {
        'debug'       : sinon.stub(),
        'warn'        : sinon.stub(),
        'error'       : sinon.stub()
      },
      'utils'       : {
        'getQS'       : sinon.stub()
      }
    } );
  } );

  describe( '#reqOptions', function() {
    var headers,
        url;

    before( function() {
      headers = {
        'headerKey' : 'headerValue'
      };

      url = Url.parse( 'http://some-host.com/some/path/image.jpg' );
    } );

    afterEach( function() {
      headers = {
        'headerKey' : 'headerValue'
      };
    } );

    describe( 'when a querystring parameters exist in the url', function() {
      before( function() {
        media.__get__( 'utils' ).getQS.returns( { 'paramKey': 'paramValue' } );
      } );

      it( 'should include them in the options path', function() {
        var options = media.reqOptions( headers, url );
        expect( options.path ).to.contain( '?paramKey=paramValue' );
      } );
    } );

    it( 'should set the headers host to the url host value', function() {
      var options = media.reqOptions( headers, url );
      expect( headers.host ).to.be.equal( url.host );
      expect( options.headers.host ).to.be.equal( url.host );
    } );

    describe( 'when config keepAlive is false', function() {
      var bkpKeepAlive;

      before( function() {
        bkpKeepAlive = media.__get__( 'config' ).keepAlive;
        media.__get__( 'config' ).keepAlive = false;
      } );

      after( function() {
        media.__get__( 'config' ).keepAlive = bkpKeepAlive;
      } );

      it( 'should opt out of connection pooling', function() {
        var options = media.reqOptions( headers, url );
        expect( options ).to.contain.key( 'agent' );
      } );
    } );

    describe( 'when config keepAlive is true', function() {
      var bkpKeepAlive;

      before( function() {
        bkpKeepAlive = media.__get__( 'config' ).keepAlive;
        media.__get__( 'config' ).keepAlive = true;
      } );

      after( function() {
        media.__get__( 'config' ).keepAlive = bkpKeepAlive;
      } );

      it( 'should NOT opt out of connection pooling', function() {
        var options = media.reqOptions( headers, url );
        expect( options ).not.to.contain.key( 'agent' );
      } );
    } );

    it( 'should return an object with keys: "hostname", "port", "path", and "headers"', function() {
      var options = media.reqOptions( headers, url );
      expect( options ).to.contain.key( 'hostname' );
      expect( options ).to.contain.key( 'port' );
      expect( options ).to.contain.key( 'path' );
      expect( options ).to.contain.key( 'headers' );
    } );
  } );
} );