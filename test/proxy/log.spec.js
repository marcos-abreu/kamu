'use strict';

require( '../common' );


describe( 'log module', function() {
  var log;

  before( function() {
    log = rewire( '../proxy/log' );
    log.__set__( 'console', { log: sinon.stub(), error: sinon.stub() } );
  } );

  describe( 'debug method', function() {
    describe( 'when config log is set to debug', function() {
      var bkpLogConfig;

      before( function() {
        bkpLogConfig = log.__get__( 'config' ).log;
        log.__get__( 'config' ).log = 'debug';
      } );

      after( function() {
        log.__get__( 'config' ).log = bkpLogConfig;
      } );

      it( 'should log the message', function() {
        log.__get__( 'console' ).log.reset();
        log.debug( 'some message' );
        expect( log.__get__( 'console' ).log ).to.have.been.calledThrice;
        expect( log.__get__( 'console' ).log.getCall( 1 ).args[ 0 ] ).to.be.equal( 'some message' );
      } );
    } );

    describe( 'when config log is NOT set to debug', function() {
      var bkpLogConfig;

      before( function() {
        bkpLogConfig = log.__get__( 'config' ).log;
        log.__get__( 'config' ).log = 'disabled';
      } );

      after( function() {
        log.__get__( 'config' ).log = bkpLogConfig;
      } );

      it( 'should NOT log the message', function() {
        log.__get__( 'console' ).log.reset();
        log.debug( 'some message' );
        expect( log.__get__( 'console' ).log ).not.to.have.been.called;
      } );
    } );
  } );

  describe( 'error method', function() {
    describe( 'when config log is NOT disabled', function() {
      var bkpLogConfig;

      before( function() {
        bkpLogConfig = log.__get__( 'config' ).log;
        log.__get__( 'config' ).log = 'enabled';
      } );

      after( function() {
        log.__get__( 'config' ).log = bkpLogConfig;
      } );

      it( 'should log the message', function() {
        log.__get__( 'console' ).error.reset();
        log.error( 'error message' );
        expect( log.__get__( 'console' ).error ).to.have.been.calledOnce;
        expect( log.__get__( 'console' ).error.getCall( 0 ).args[ 0 ] ).to.contain( 'error message' );
      } );
    } );

    describe( 'when config log is disabled', function() {
      var bkpLogConfig;

      before( function() {
        bkpLogConfig = log.__get__( 'config' ).log;
        log.__get__( 'config' ).log = 'disabled';
      } );

      after( function() {
        log.__get__( 'config' ).log = bkpLogConfig;
      } );

      it( 'should NOT log the message', function() {
        log.__get__( 'console' ).error.reset();
        log.error( 'error message' );
        expect( log.__get__( 'console' ).error ).not.to.have.been.called;
      } );
    } );
  } );
} );
