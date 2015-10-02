'use strict';

require( '../../../common' );

var Url = require( 'url' );

describe( 'utils index', function() {
  var utils;

  before( function() {
    utils = rewire( '../src/utils/index' );

    utils.__set__( {
      'log'       : {
        'debug'     : sinon.stub(),
        'warn'      : sinon.stub(),
        'error'     : sinon.stub()
      },
      'connStatus': {
        'start'     : sinon.stub(),
        'open'      : sinon.stub(),
        'close'     : sinon.stub(),
        'toString'  : sinon.stub()
      }
    } );
  } );

  describe( '#writeErrorHead', function() {
    var res;

    before( function() {
      res = {
        'writeHead' : sinon.stub()
      };
    } );

    it( 'should write the response header', function() {
      res.writeHead.reset();
      utils.__get__( 'writeErrorHead' )( res, 200 );
      expect( res.writeHead ).to.have.been.calledOnce;
    } );

    it( 'should pass the informed status code when writting response header', function() {
      res.writeHead.reset();
      utils.__get__( 'writeErrorHead' )( res, 200 );
      expect( res.writeHead.getCall( 0 ).args[ 0 ] ).to.be.equal( 200 );
    } );
  } );

  describe( '#fourOhFour', function() {
    var revertWriteErrorHead,
        revertFinish,
        stubWriteErrorHead,
        stubFinish,
        res,
        msg,
        url;

    before( function() {
      stubWriteErrorHead = sinon.stub();
      stubFinish = sinon.stub();
      revertWriteErrorHead = utils.__set__( 'writeErrorHead', stubWriteErrorHead );
      revertFinish = utils.__set__( 'finish', stubFinish );

      res = {};
      msg = 'not found message';
      url = Url.parse( 'http://some-host.com/path/to/image.jpg' );
    } );

    after( function() {
      revertWriteErrorHead();
      revertFinish();
    } );

    it( 'should log a warning', function() {
      utils.__get__( 'log' ).warn.reset();
      utils.fourOhFour( res, msg, url );
      expect( utils.__get__( 'log' ).warn ).to.have.been.calledOnce;
    } );

    it( 'should write a 404 response', function() {
      utils.__get__( 'writeErrorHead' ).reset();
      utils.fourOhFour( res, msg, url );
      expect( utils.__get__( 'writeErrorHead' ) ).to.have.been.calledOnce;
      expect( utils.__get__( 'writeErrorHead' ).getCall( 0 ).args [1 ] ).to.be.equal( 404 );
    } );

    it( 'should finish the response', function() {
      utils.__get__( 'finish' ).reset();
      utils.fourOhFour( res, msg, url );
      expect( utils.__get__( 'finish' ) ).to.have.been.calledOnce;
      expect( utils.__get__( 'finish' ).getCall( 0 ).args[ 0 ] ).to.be.equal( res );
    } );
  } );

  describe( '#fiveHundred', function() {
    var revertWriteErrorHead,
        revertFinish,
        stubWriteErrorHead,
        stubFinish,
        res,
        msg,
        url;

    before( function() {
      stubWriteErrorHead = sinon.stub();
      stubFinish = sinon.stub();
      revertWriteErrorHead = utils.__set__( 'writeErrorHead', stubWriteErrorHead );
      revertFinish = utils.__set__( 'finish', stubFinish );

      res = {};
      msg = 'not found message';
      url = Url.parse( 'http://some-host.com/path/to/image.jpg' );
    } );

    after( function() {
      revertWriteErrorHead();
      revertFinish();
    } );

    it( 'should log an error', function() {
      utils.__get__( 'log' ).error.reset();
      utils.fiveHundred( res, msg, url );
      expect( utils.__get__( 'log' ).error ).to.have.been.calledOnce;
    } );

    it( 'should write the 500 response', function() {
      utils.__get__( 'writeErrorHead' ).reset();
      utils.fiveHundred( res, msg, url );
      expect( utils.__get__( 'writeErrorHead' ) ).to.have.been.calledOnce;
      expect( utils.__get__( 'writeErrorHead' ).getCall( 0 ).args [1 ] ).to.be.equal( 500 );
    } );

    it( 'should finish the response', function() {
      utils.__get__( 'finish' ).reset();
      utils.fiveHundred( res, msg, url );
      expect( utils.__get__( 'finish' ) ).to.have.been.calledOnce;
      expect( utils.__get__( 'finish' ).getCall( 0 ).args[ 0 ] ).to.be.equal( res );
    } );
  } );

  describe( '#finish', function() {
    var res;

    before( function() {
      res = {
        end: sinon.stub()
      };
    } );

    it( 'should close the connection status', function() {
      utils.__get__( 'connStatus' ).close.reset();
      utils.finish( res, 'message' );
      expect( utils.__get__( 'connStatus' ).close ).to.have.been.calledOnce;
    } );

    describe( 'when the response connection is open', function() {
      before( function() {
        res.connection = { prop: 'value' };
      } );

      after( function() {
        delete res.connection;
      } );

      it( 'should end the response', function() {
        res.end.reset();
        utils.finish( res, 'message' );
        expect( res.end ).to.have.been.calledOnce;
      } );
    } );

    describe( 'when the response connection is not open', function() {
      before( function() {
        delete res.connection;
      } );

      describe( 'and the response finish flag is off', function() {

        before( function() {
          res.finished = false;
        } );

        after( function() {
          delete res.finished;
        } );

        it( 'should end the response', function() {
          res.end.reset();
          utils.finish( res, 'message' );
          expect( res.end ).to.have.been.calledOnce;
        } );
      } );

      describe( 'and the response finish flag is on', function() {
        before( function() {
          res.finished = true;
        } );

        after( function() {
          delete res.finished;
        } );

        it( 'should NOT end the response', function() {
          res.end.reset();
          utils.finish( res, 'message' );
          expect( res.end ).not.to.have.been.called;
        } );
      } );
    } );

  } );

  describe( '#getQS', function() {
    describe( 'when no url is informed', function() {
      it( 'should return undefined', function() {
        var result = utils.getQS();
        expect( result ).to.be.undefined;
      } );
    } );

    describe( 'when url is informed, but no query or search available', function() {
      it( 'should return undefined', function() {
        var result = utils.getQS( Url.parse( 'http://some-host.com/path/to/image.jpg' ) );
        expect( result ).to.be.undefined;
      } );
    } );

    describe( 'when url is informed with either a query or search property', function() {
      it( 'should parse it into an object and return it', function() {
        var result = utils.getQS( Url.parse( 'http://some-host.com/path/to/image.jpg?key=val&key2=val2' ) );
        expect( result ).not.to.be.undefined;
        expect( result ).to.contain.keys( [ 'key', 'key2' ] );
      } );
    } );
  } );
} );