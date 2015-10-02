'use strict';

require( '../../common' );

describe( 'schema', function() {
  var schema;

  before( function() {
    schema = rewire( '../src/schema' );

    schema.__set__( {
      'log'         : {
        'warn'        : sinon.stub()
      }
    } );
  } );

  describe( '#decodeUrl', function() {

    describe( 'when no string is informed', function() {
      it( 'should return undefined', function() {
        var result = schema.decodeUrl();
        expect( result ).to.be.undefined;
      } );
    } );

    describe( 'when encoded string is not a valid hexadecimal string', function() {
      it( 'should return undefined', function() {
        var result = schema.decodeUrl( 'even string' );
        expect( result ).to.be.undefined;
        result = schema.decodeUrl( 'YYYYYY' );
        expect( result ).to.be.undefined;
      } );
    } );

    describe( 'when processing the encoded string generates an exception', function() {
      var bkpToString;

      before( function() {
        bkpToString = Buffer.prototype.toString;
        Buffer.prototype.toString = function() {
          throw new Error( 'someError' );
          return;
        };
      } );

      after( function() {
        Buffer.prototype.toString = bkpToString;
      } );

      it( 'should log a warning', function() {
        schema.__get__( 'log' ).warn.reset();
        schema.decodeUrl( 'ffaa0099' );
        expect( schema.__get__( 'log' ).warn ).to.have.been.calledOnce;
      } );

      it( 'should return undefined', function() {
        var result = schema.decodeUrl( 'ffaa0099' );
        expect( result ).to.be.undefined;
      } );
    } );

    describe( 'when successifully decoded string', function() {
      it( 'should return the decoded string', function() {
        var result = schema.decodeUrl( 'ffaa0099' );
        expect( result ).to.be.equal( new Buffer( 'ffaa0099', 'hex' ).toString() );
      } );
    } );

  } );
} );
