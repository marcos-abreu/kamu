'use strict';

require( '../../common' );


describe( 'connection-status module', function() {
  var connStatus;

  before( function() {
    connStatus = rewire( '../proxy/connection-status' );
  } );

  describe( 'start method', function() {
    var bkpTotalConn,
        bkpCurrentConn,
        bkpStartedAt;

    before( function() {
      bkpTotalConn = connStatus.__get__( 'totalConn' );
      bkpCurrentConn = connStatus.__get__( 'currentConn' );
      bkpStartedAt = connStatus.__get__( 'startedAt' );
    } );

    after( function() {
      connStatus.__set__( {
        'totalConn': bkpTotalConn,
        'currentConn': bkpCurrentConn,
        'startedAt': bkpStartedAt
      } );
    } );

    beforeEach( function() {
      connStatus.__set__( {
        'totalConn': void 0,
        'currentConn': void 0,
        'startedAt': void 0
      } );
    } );

    it( 'should initialize the connection meta info', function() {
      connStatus.start();
      expect( connStatus.__get__( 'totalConn' ) ).to.be.equal( 0 );
      expect( connStatus.__get__( 'currentConn' ) ).to.be.equal( 0 );
      expect( connStatus.__get__( 'startedAt' ) ).to.exist;
    } );
  } );

  describe( 'open method', function() {
    var bkpTotalConn,
        bkpCurrentConn,
        bkpStartedAt;

    before( function() {
      bkpTotalConn = connStatus.__get__( 'totalConn' );
      bkpCurrentConn = connStatus.__get__( 'currentConn' );
      bkpStartedAt = connStatus.__get__( 'startedAt' );
    } );

    after( function() {
      connStatus.__set__( {
        'totalConn': bkpTotalConn,
        'currentConn': bkpCurrentConn,
        'startedAt': bkpStartedAt
      } );
    } );

    beforeEach( function() {
      connStatus.__set__( {
        'totalConn': 0,
        'currentConn': 0,
        'startedAt': new Date()
      } );
    } );

    it( 'should increase the total connections', function() {
      connStatus.open();
      expect( connStatus.__get__( 'totalConn' ) ).to.be.equal( 1 );
    } );

    it( 'should increase the current connections', function() {
      connStatus.open();
      expect( connStatus.__get__( 'currentConn' ) ).to.be.equal( 1 );
    } );
  } );

  describe( 'close method', function() {
    var bkpTotalConn,
        bkpCurrentConn,
        bkpStartedAt;

    before( function() {
      bkpTotalConn = connStatus.__get__( 'totalConn' );
      bkpCurrentConn = connStatus.__get__( 'currentConn' );
      bkpStartedAt = connStatus.__get__( 'startedAt' );
    } );

    after( function() {
      connStatus.__set__( {
        'totalConn': bkpTotalConn,
        'currentConn': bkpCurrentConn,
        'startedAt': bkpStartedAt
      } );
    } );

    beforeEach( function() {
      connStatus.__set__( {
        'totalConn': 10,
        'currentConn': 10,
        'startedAt': new Date()
      } );
    } );

    it( 'should decrease the current connections', function() {
      connStatus.close();
      expect( connStatus.__get__( 'currentConn' ) ).to.be.equal( 9 );
    } );

    describe( 'when current connections less than 1', function() {
      beforeEach( function() {
        connStatus.__set__( {
          'totalConn': 10,
          'currentConn': -1,
          'startedAt': new Date()
        } );
      } );

      it( 'should set the current connections to 0', function() {
        connStatus.close();
        expect( connStatus.__get__( 'currentConn' ) ).to.be.equal( 0 );
      } );
    } );
  } );

  describe( 'toString method', function() {
    var bkpTotalConn,
        bkpCurrentConn,
        bkpStartedAt;

    before( function() {
      bkpTotalConn = connStatus.__get__( 'totalConn' );
      bkpCurrentConn = connStatus.__get__( 'currentConn' );
      bkpStartedAt = connStatus.__get__( 'startedAt' );
    } );

    after( function() {
      connStatus.__set__( {
        'totalConn': bkpTotalConn,
        'currentConn': bkpCurrentConn,
        'startedAt': bkpStartedAt
      } );
    } );

    beforeEach( function() {
      connStatus.__set__( {
        'totalConn': 10,
        'currentConn': 6,
        'startedAt': new Date()
      } );
    } );

    it( 'should return a string with the connections info', function() {
      var result = connStatus.toString();
      expect( result ).to.contain( '6/10 since' );      
    } );
  } );
} );
