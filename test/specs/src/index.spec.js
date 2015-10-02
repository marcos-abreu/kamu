'use strict';

require( '../../common' );

describe( 'app index', function() {
  var fakeReq,
      fakeRes,
      index,
      config;

  before( function() {
    config = require( '../../../src/config' );

    fakeReq = {
      'headers': {
        'SomeHeaderKey': 'SomeHeaderValue'
      }
    };

    fakeRes = {};

    index = rewire( '../src/index' );
    index.__set__( {
      'Crypto'        : {
        'createHmac'    : sinon.stub().returns( {
          'update'        : sinon.stub(),
          'digest'        : sinon.stub().returns( 'encoded-key' )
        } )
      },
      'Url'           : {
        'parse'         : sinon.stub().returns( {
          'host':     'www.some-domain.com',
          'hostname': 'www.some-domain.com',
          'pathname': '/encoded-key/encoded-url',
          'protocol': 'http:',
          'port': 80,
          'format': function(){}
        } )
      },
      'log'           : {
        'debug'         : function(){},
        'warn'          : function(){},
        'error'         : sinon.stub()
      },
      'transform'     : {
        'parseUrl'      : sinon.stub(),
        'parseQS'       : sinon.stub()
      },
      'schema'        : {
        'decodeUrl'     : sinon.stub().returns( 'decoded-url' )
      },
      'proxy'         : {
        'processUrl'    : sinon.stub()
      },
      'utils'          : {
        'fourOhFour'    : sinon.stub(),
        'getQS'         : sinon.stub()
      }
    } )

  } );

  describe( '#processUrl', function() {
    it( 'should delete original request cookies', function() {
      fakeReq.cookies = 'some cookies';
      index.processRequest( fakeReq, fakeRes );
      expect( fakeReq.cookies ).not.to.be.defined;
    } );

    it( 'should try to decode the media url', function() {
      index.__get__( 'schema' ).decodeUrl.reset();
      index.processRequest( fakeReq, fakeRes );
      expect( index.__get__( 'schema' ).decodeUrl ).to.have.been.calledOnce;
    } );

    describe( 'when failing to decode from url', function() {
      var bkpDecodeUrl,
          newUrlParse,
          bkpPathname,
          bkpGetQS;

      before( function() {
        bkpDecodeUrl = index.__get__( 'schema' ).decodeUrl();
        index.__get__( 'schema' ).decodeUrl.returns( void 0 );

        newUrlParse = index.__get__( 'Url' ).parse();
        bkpPathname = newUrlParse.pathname;
        newUrlParse.pathname = '/encoded-key?url=encoded-url-from-qs';
        index.__get__( 'Url' ).parse.returns( newUrlParse );

        bkpGetQS = index.__get__( 'utils' ).getQS();
        index.__get__( 'utils' ).getQS.returns( {
          url: 'encoded-url-from-qs'
        } );
      } );

      after( function() {
        index.__get__( 'schema' ).decodeUrl.returns( bkpDecodeUrl );
        newUrlParse.pathname = bkpPathname;
        index.__get__( 'Url' ).parse.returns( newUrlParse );
        index.__get__( 'utils' ).getQS.returns( bkpGetQS );
      } );

      it( 'should try to decode media url from querystring', function() {
        index.__get__( 'schema' ).decodeUrl.reset();
        index.processRequest( fakeReq, fakeRes );
        expect( index.__get__( 'schema' ).decodeUrl ).to.have.been.calledTwice;
        expect( index.__get__( 'schema' ).decodeUrl.getCall( 1 ).args[ 0 ] ).to.be.equal( 'encoded-url-from-qs' );
      } );
    } );

    describe( 'when failing to decode media from url and querystring', function() {
      var bkpDecodeUrl,
          newUrlParse,
          bkpPathname,
          bkpGetQS;

      before( function() {
        bkpDecodeUrl = index.__get__( 'schema' ).decodeUrl();
        index.__get__( 'schema' ).decodeUrl.returns( void 0 );

        newUrlParse = index.__get__( 'Url' ).parse();
        bkpPathname = newUrlParse.pathname;
        newUrlParse.pathname = '/encoded-key';
        index.__get__( 'Url' ).parse.returns( newUrlParse );

        bkpGetQS = index.__get__( 'utils' ).getQS();
        index.__get__( 'utils' ).getQS.returns( {} );
      } );

      after( function() {
        index.__get__( 'schema' ).decodeUrl.returns( bkpDecodeUrl );
        newUrlParse.pathname = bkpPathname;
        index.__get__( 'Url' ).parse.returns( newUrlParse );
        index.__get__( 'utils' ).getQS.returns( bkpGetQS );
      } );

      it( 'should return not found', function() {
        index.__get__( 'utils' ).fourOhFour.reset();
        index.processRequest( fakeReq, fakeRes );
        expect( index.__get__( 'utils' ).fourOhFour ).to.have.been.calledOnce;
        expect( index.__get__( 'utils' ).fourOhFour.getCall( 0 ).args[ 1 ] ).to.be.equal( 'missing required media url' );
      } );
    } );

    describe( 'when urlpath has more than 3 parts', function() {
      var newUrlParse,
          bkpPathname;

      before( function() {
        newUrlParse = index.__get__( 'Url' ).parse();
        bkpPathname = newUrlParse.pathname;
        newUrlParse.pathname = '/encoded-key/encoded-url/transform_options';
        index.__get__( 'Url' ).parse.returns( newUrlParse );
      } );

      after( function() {
        newUrlParse.pathname = bkpPathname;
        index.__get__( 'Url' ).parse.returns( newUrlParse );
      } );

      it( 'should try to parse transform options from url', function() {
        index.__get__( 'transform' ).parseUrl.reset();
        index.processRequest( fakeReq, fakeRes );
        expect( index.__get__( 'transform' ).parseUrl ).to.have.been.called;
        expect( index.__get__( 'transform' ).parseUrl.getCall( 0 ).args[ 0 ] ).to.be.equal( 'transform_options' );
      } );
    } );

    describe( 'when failing to parse transform options from url', function() {
      var newUrlParse,
          bkpPathname,
          bkpGetQS;

      before( function() {
        newUrlParse = index.__get__( 'Url' ).parse();
        bkpPathname = newUrlParse.pathname;
        newUrlParse.pathname = '/encoded-key/encoded-url';
        index.__get__( 'Url' ).parse.returns( newUrlParse );

        bkpGetQS = index.__get__( 'utils' ).getQS();
        index.__get__( 'utils' ).getQS.returns( {
          w: '100'
        } );
      } );

      after( function() {
        newUrlParse.pathname = bkpPathname;
        index.__get__( 'Url' ).parse.returns( newUrlParse );
        index.__get__( 'utils' ).getQS.returns( bkpGetQS );
      } );

      it( 'should try to parse transform options from querystring', function() {
        index.__get__( 'transform' ).parseQS.reset();
        index.processRequest( fakeReq, fakeRes );
        expect( index.__get__( 'transform' ).parseQS ).to.have.been.called;
        expect( index.__get__( 'transform' ).parseQS.getCall( 0 ).args[ 0 ] ).to.contain.keys( 'w' );
      } );
    } );

    describe( 'when current request was originated from the same kamu server', function() {
      before( function() {
        fakeReq.headers[ 'via' ] = config.proxyAgent;
      } );

      after( function() {
        delete fakeReq.headers.via;
      } );

      it( 'should return not found', function() {
        index.__get__( 'utils' ).fourOhFour.reset();
        index.processRequest( fakeReq, fakeRes );
        expect( index.__get__( 'utils' ).fourOhFour ).to.have.been.calledOnce;
        expect( index.__get__( 'utils' ).fourOhFour.getCall( 0 ).args[ 1 ] ).to.be.equal( 'Requesting from self' );
      } );
    } );

    describe( 'when signature IS NOT available', function() {
      var newUrlParse,
          bkpPathname;

      before( function() {
        newUrlParse = index.__get__( 'Url' ).parse();
        bkpPathname = newUrlParse.pathname;
        newUrlParse.pathname = '//encoded-url';
        index.__get__( 'Url' ).parse.returns( newUrlParse );
      } );

      after( function() {
        newUrlParse.pathname = bkpPathname;
        index.__get__( 'Url' ).parse.returns( newUrlParse );
      } );

      it( 'should return not found', function() {
        index.__get__( 'utils' ).fourOhFour.reset();
        index.processRequest( fakeReq, fakeRes );
        expect( index.__get__( 'utils' ).fourOhFour ).to.have.been.calledOnce;
        expect( index.__get__( 'utils' ).fourOhFour.getCall( 0 ).args[ 1 ] ).to.be.equal( 'No signature provided' );
      } );
    } );

    describe( 'when signature is available', function() {

      describe( 'when failing to create signature', function() {
        before( function() {
          index.__get__( 'Crypto' ).createHmac().update = function() {
            throw new Error( 'libError' );
            return;
          };
        } );

        after( function() {
          index.__get__( 'Crypto' ).createHmac().update = sinon.stub();
        } );

        it( 'should return not found', function() {
          index.__get__( 'utils' ).fourOhFour.reset();
          index.processRequest( fakeReq, fakeRes );
          expect( index.__get__( 'utils' ).fourOhFour ).to.have.been.calledOnce;
          expect( index.__get__( 'utils' ).fourOhFour.getCall( 0 ).args[ 1 ] ).to.be.equal( 'could not create signature' );
        } );
      } );

      describe( 'when signature created DOES NOT match signture provided', function() {
        var bkpDigest;

        before( function() {
          bkpDigest = index.__get__( 'Crypto' ).createHmac().digest();
          index.__get__( 'Crypto' ).createHmac().digest.returns( 'encoded-different-key' );
        } );

        after( function() {
          index.__get__( 'Crypto' ).createHmac().digest.returns( bkpDigest );
        } );

        it ( 'should return not found', function() {
          index.__get__( 'utils' ).fourOhFour.reset();
          index.processRequest( fakeReq, fakeRes );
          expect( index.__get__( 'utils' ).fourOhFour ).to.have.been.calledOnce;
          expect( index.__get__( 'utils' ).fourOhFour.getCall( 0 ).args[ 1 ] ).to.be.equal( 'signature mismatch: encoded-different-key | encoded-key' );
        } );
      } );

      describe( 'when signature created MATCHES signature provided', function() {
        it( 'should process the media request', function() {
          index.__get__( 'proxy' ).processUrl.reset();
          index.processRequest( fakeReq, fakeRes );
          expect( index.__get__( 'proxy' ).processUrl ).to.have.been.calledOnce;
        } );
      } );

    } );

  } );

} );

// 'use strict';

// require( '../../common' );

// var Url = require( 'url' );

// describe( 'proxy index', function() {
//   var index,
//       fakeResponse,
//       fakeProtocol;

//   before( function() {
//     fakeProtocol = {
//       'on': sinon.stub(),
//       'setTimeout': function() {},
//       'abort': sinon.stub().returns( 'request aborted' )
//     };

//     fakeResponse = {
//       'connection': {},
//       'end': sinon.stub(),
//       'writeHead': sinon.stub(),
//       'on': sinon.stub()
//     };

//     index = rewire( '../src/index' );

//     index.__set__( {
//       'Crypto'        : {
//         'createHmac'    : function(){}
//       },
//       'Url'           : {
//         'parse'         : sinon.stub().returns( {
//           'host':     'www.some-domain.com',
//           'hostname': 'www.some-domain.com',
//           'protocol': 'http:',
//           'port': 80,
//           'format': function(){}
//         } )
//       },
//       'log'           : {
//         'debug'         : function(){},
//         'warn'          : function(){},
//         'error'         : sinon.stub()
//       },
//       'transform'     : function(){},
//       'schema'        : {
//         'decodeUrl'   : function(){}
//       },
//       'proxy'         : {
//         'processUrl'    : function(){}
//       },
//       'utils'          : {
//         'fourOhFour'    : function(){},
//         'fiveHundred'   : function(){},
//         'finish'        : function(){},
//         'getQS'         : function(){}
//       }
//     } );
//   } );

//   describe( 'finish method', function() {

//     it( 'should close the connection status', function() {
//       index.__get__( 'connStatus' ).close.reset();
//       index.__get__( 'finish' )( fakeResponse, 'some string' );
//       expect( index.__get__( 'connStatus' ).close ).to.have.been.calledOnce;
//     } );

//     describe( 'when response connection is available', function() {
//       var bkpConnection;

//       before( function() {
//         bkpConnection = fakeResponse.connection;
//         fakeResponse.connection = {};
//       } );

//       after( function() {
//         fakeResponse.connection = bkpConnection;
//       } );

//       it( 'should call response end with the string parameter', function() {
//         fakeResponse.end.reset();
//         index.__get__( 'finish' )( fakeResponse, 'some string' );
//         expect( fakeResponse.end ).to.have.been.calledOnce;
//         expect( fakeResponse.end ).to.have.been.calledWith( 'some string' );
//       } );
//     } );

//     describe( 'when response connection is NOT available', function() {
//       var bkpConnection;

//       before( function() {
//         bkpConnection = fakeResponse.connection;
//         fakeResponse.connection = void 0;
//       } );

//       after( function() {
//         fakeResponse.connection = bkpConnection;
//       } );

//       it( 'should NOT call the response end method', function() {
//         fakeResponse.end.reset();
//         index.__get__( 'finish' )( fakeResponse, 'some string' );
//         expect( fakeResponse.end ).not.to.have.been.called;
//       } );

//       it( 'should return undefined', function() {
//         var result = index.__get__( 'finish' )( fakeResponse, 'some string' );
//         expect( result ).not.to.exist;
//       } );
//     } );
//   } );

//   describe( 'fourOhFour method', function() {
//     var testUrl,
//         revertFinish;

//     before( function() {
//       revertFinish = index.__set__( 'finish', sinon.stub() );
//       testUrl = Url.parse( 'http://www.some-domain.com/some/path' );
//     } );

//     after( function() {
//       revertFinish();
//     } );

//     describe( 'when a url object parameter is informed', function() {
//       it( 'should log the error message with the url', function() {
//         index.__get__( 'log' ).error.reset();
//         index.__get__( 'fourOhFour' )( fakeResponse, 'some message', testUrl );
//         expect( index.__get__( 'log' ).error ).to.have.been.calledOnce;
//         expect( index.__get__( 'log' ).error ).to.have.been.calledWith( 'some message: http://www.some-domain.com/some/path' );
//       } );
//     } );

//     describe( 'when a url object parameter is NOT informed', function() {
//       it( 'should log the error message with unknown as the url', function() {
//         index.__get__( 'log' ).error.reset();
//         index.__get__( 'fourOhFour' )( fakeResponse, 'some message' );
//         expect( index.__get__( 'log' ).error ).to.have.been.calledOnce;
//         expect( index.__get__( 'log' ).error ).to.have.been.calledWith( 'some message: unknown' );
//       } );
//     } );

//     it( 'should write a 404 response with a no-cache policy', function() {
//       fakeResponse.writeHead.reset();
//       index.__get__( 'fourOhFour' )( fakeResponse, 'some message', testUrl );
//       expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//       expect( fakeResponse.writeHead.getCall( 0 ).args[ 0 ] ).to.be.equal( 404 );
//       expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'expires' ] ).to.be.equal( '0' );
//       expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'Cache-Control' ] ).to.be.equal( 'no-cache, no-store, private, must-revalidate' );
//     } );

//     it( 'should finish the response', function() {
//       index.__get__( 'finish' ).reset();
//       index.__get__( 'fourOhFour' )( fakeResponse, 'some message', testUrl );
//       expect( index.__get__( 'finish' ) ).to.have.been.calledOnce;
//       expect( index.__get__( 'finish' ).getCall( 0 ).args[ 0 ] ).to.be.equal( fakeResponse );
//       expect( index.__get__( 'finish' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Not Found' );
//     } );
//   } );


//   describe( 'processUrl method', function() {
//     var restoreFourOhFour,
//         urlTest;

//     before( function() {
//       restoreFourOhFour = index.__set__( 'fourOhFour', sinon.stub() );
//       index.__get__( 'fourOhFour' ).returns( 'return from fourOhFour' );
//       urlTest = Url.parse( 'http://www.some-domain.com/some/path' );
//     } );

//     after( function() {
//       restoreFourOhFour();
//     } );

//     describe( 'when asset url host is NOT defined', function() {
//       var bkpHost;

//       before( function() {
//         bkpHost = urlTest.host;
//         urlTest.host = void 0;
//       } );

//       after( function() {
//         urlTest.host = bkpHost;
//       } );

//       it( 'should respond with a 404', function() {
//         index.__get__( 'fourOhFour' ).reset();
//         index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//         expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//         expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 0 ] ).to.be.equal( fakeResponse );
//         expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'No host found undefined' );
//       } );
//     } );

//     describe( 'when asset url host is defined', function() {
//       describe( 'with an INVALID protocol', function() {
//         var bkpProtocol;

//         before( function() {
//           bkpProtocol = urlTest.protocol;
//           urlTest.protocol = 'invalid';
//         } );

//         after( function() {
//           urlTest.protocol = bkpProtocol;
//         } );

//         it( 'should return a 404 response', function() {
//           index.__get__( 'fourOhFour' ).reset();
//           var result = index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//           expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//           expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Unknown protocol' );
//           expect( result ).to.be.equal( 'return from fourOhFour' );
//         } );        
//       } );

//       describe( 'with a VALID protocol', function() {
//         describe( 'HTTP', function() {
//           var bkpProtocol;

//           before( function() {
//             bkpProtocol = urlTest.protocol;
//             urlTest.protocol = 'http:';
//           } );

//           after( function() {
//             urlTest.protocol = bkpProtocol;
//           } );

//           it( 'should use the HTTP.get method', function() {
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'Https' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             expect( index.__get__( 'Http' ).get ).to.have.been.calledOnce;
//             expect( index.__get__( 'Https' ).get ).not.to.have.been.called;
//           } );
//         } );

//         describe( 'HTTPS', function() {
//           var bkpProtocol;

//           before( function() {
//             bkpProtocol = urlTest.protocol;
//             urlTest.protocol = 'https:';
//           } );

//           after( function() {
//             urlTest.protocol = bkpProtocol;
//           } );

//           it( 'should use the HTTPS.get method', function() {
//             index.__get__( 'Https' ).get.reset();
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             expect( index.__get__( 'Https' ).get ).to.have.been.calledOnce;
//             expect( index.__get__( 'Http' ).get ).not.to.have.been.called;
//           } );
//         } );

//         describe( 'and WITH a querystring', function() {
//           var bkpQuery;

//           before( function() {
//             bkpQuery = urlTest.query;
//             urlTest.query = 'key=value';
//           } );

//           after( function() {
//             urlTest.query = bkpQuery;
//           } );

//           it( 'should append the querystring to query path', function() {
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             expect( index.__get__( 'Http' ).get ).to.have.been.calledOnce;
//             expect( index.__get__( 'Http' ).get.getCall( 0 ).args[ 0 ].path ).to.contain( '?key=value' );
//           } );
//         } );

//         describe( 'and WITHOUT a querystring', function() {
//           var bkpQuery;

//           before( function() {
//             bkpQuery = urlTest.query;
//             urlTest.query = void 0;
//           } );

//           after( function() {
//             urlTest.query = bkpQuery;
//           } );

//           it( 'should have no querystring on the query path', function() {
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             expect( index.__get__( 'Http' ).get ).to.have.been.calledOnce;
//             expect( index.__get__( 'Http' ).get.getCall( 0 ).args[ 0 ].path ).to.not.contain( '?' );
//           } );
//         } );

//         describe( 'when keepAlive is set to false', function() {
//           var bkpKeepAlive;

//           before( function() {
//             bkpKeepAlive = index.__get__( 'config' ).keepAlive;
//             index.__get__( 'config' ).keepAlive = false;
//           } );

//           after( function() {
//             index.__get__( 'config' ).keepAlive = bkpKeepAlive;
//           } );

//           it( 'should opt out of connection pooling', function() {
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             expect( index.__get__( 'Http' ).get ).to.have.been.calledOnce;
//             expect( index.__get__( 'Http' ).get.getCall( 0 ).args[ 0 ].agent ).to.exist;
//             expect( index.__get__( 'Http' ).get.getCall( 0 ).args[ 0 ].agent ).to.be.equal( false );
//           } );
//         } );

//         describe( 'when keepAlive is NOT false', function() {
//           var bkpKeepAlive;

//           before( function() {
//             bkpKeepAlive = index.__get__( 'config' ).keepAlive;
//             index.__get__( 'config' ).keepAlive = true;
//           } );

//           after( function() {
//             index.__get__( 'config' ).keepAlive = bkpKeepAlive;
//           } );

//           it( 'should NOT opt out of connection pooling', function() {
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             expect( index.__get__( 'Http' ).get ).to.have.been.calledOnce;
//             expect( index.__get__( 'Http' ).get.getCall( 0 ).args[ 0 ].agent ).not.to.exist;
//           } );
//         } );

//         describe.skip( 'when request takes too long', function() {
//           var bkpSetTimeout,
//               bkpSocketTimeout,
//               clock;

//           before( function() {
//             bkpSocketTimeout = index.__get__( 'config' ).socketTimeout;
//             index.__get__( 'config' ).socketTimeout = 5;

//             bkpSetTimeout = fakeProtocol.setTimeout;
//             // fakeProtocol.setTimeout = setTimeout;
//             // console.log( typeof( setTimeout ) );
//             console.log( index.__get__( 'config' ).socketTimeout );
//           } );

//           after( function() {
//             index.__get__( 'config' ).socketTimeout = bkpSocketTimeout;
//             fakeProtocol.setTimeout = bkpSetTimeout;
//           } );

//           beforeEach( function () {
//             // clock = sinon.useFakeTimers();
//           } );

//           afterEach(function () {
//             // clock.restore();
//           } );

//           it( 'should abort the request', function() {
//             fakeProtocol.abort.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             // clock.tick( ( 5 * 1000 ) - 10 );
//             // expect( fakeProtocol.abort ).not.to.have.been.called;
//             // clock.tick( 20 );
//             // expect( fakeProtocol.abort ).to.have.been.calledOnce;
//           } );

//           it( 'should return a 404', function() {
//             // index.__get__( 'fourOhFour' ).reset();
//             // var result = index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             // clock.tick( 5 * 1000 );
//             // expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//             // expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Socket timeout' );
//             // expect( result ).to.be.equal( 'return from fourOhFour' );
//           } );
//         } );

//         describe( 'when request fails', function() {
//           var errCallback;

//           before( function() {
//             fakeProtocol.on.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             errCallback = fakeProtocol.on.getCall( 0 ).args[ 1 ];
//           } );

//           it( 'should return a 404 response', function() {            
//             index.__get__( 'fourOhFour' ).reset();
//             var result = errCallback( { stack: 'stack' } );
//             expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//             expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Client Request error stack' );
//             expect( result ).to.be.equal( 'return from fourOhFour' );
//           } );
//         } );

//         describe( 'when response is aborted', function() {
//           var closeCallback;

//           before( function() {
//             fakeResponse.on.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             closeCallback = fakeResponse.on.getCall( 0 );
//             // this following is just to make sure I got the right call
//             expect( closeCallback ).to.be.calledWith( 'close', sinon.match.func );
//             closeCallback = closeCallback.args[ 1 ];
//           } );

//           it( 'should log an error', function() {
//             index.__get__( 'log' ).error.reset();
//             closeCallback();
//             expect( index.__get__( 'log' ).error ).to.have.been.calledOnce;
//             expect( index.__get__( 'log' ).error ).to.have.been.calledWith( 'Request aborted' );
//           } );

//           it( 'should abort the external request', function() {
//             fakeProtocol.abort.reset();
//             var result = closeCallback();
//             expect( fakeProtocol.abort ).to.have.been.calledOnce;
//             expect( result ).to.be.equal( 'request aborted' );
//           } );
//         } );

//         describe( 'when response fails', function() {
//           var errCallback;

//           before( function() {
//             fakeResponse.on.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             errCallback = fakeResponse.on.getCall( 1 );
//             // this following is just to make sure I got the right call
//             expect( errCallback ).to.be.calledWith( 'error', sinon.match.func );
//             errCallback = errCallback.args[ 1 ];
//           } );

//           it( 'should log an error', function() {
//             index.__get__( 'log' ).error.reset();
//             errCallback( 'some error' );
//             expect( index.__get__( 'log' ).error ).to.have.been.calledOnce;
//             expect( index.__get__( 'log' ).error ).to.have.been.calledWith( 'Request error: some error' );
//           } );

//           it( 'should abort the external request', function() {
//             fakeProtocol.abort.reset();
//             var result = errCallback( 'some error' );
//             expect( fakeProtocol.abort ).to.have.been.calledOnce;
//             expect( result ).to.be.equal( 'request aborted' );
//           } );
//         } );

//         describe( 'external response callback', function() {
//           var externalCallback,
//               fakeExternalResponse,
//               restoreProcessUrl;

//           before( function() {
//             index.__get__( 'Http' ).get.reset();
//             index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 3 );
//             externalCallback = index.__get__( 'Http' ).get.getCall( 0 ).args[ 1 ];

//             fakeExternalResponse = {
//               'headers' : {
//                 'content-type': 'image/jpeg',
//                 'content-length': ( 2 * 1024 * 1024 ) + 1, // 2Mb + 1 byte
//                 'location': 'http://www.sample-domain.com/asset/path'
//               },
//               'destroy': sinon.stub(),
//               'on': sinon.stub(),
//               'statusCode': 200,
//               'pipe': sinon.stub()
//             };

//             restoreProcessUrl = index.__set__( 'processUrl', sinon.stub() );
//           } );

//           after( function() {
//             restoreProcessUrl();
//           } );

//           describe( 'when external response exceeded size limit', function() {
//             var bkpLengthLimit;

//             before( function() {
//               bkpLengthLimit = index.__get__( 'config' ).lengthLimit;
//               index.__get__( 'config' ).lengthLimit = 2 * 1024 * 1024; // 2mb
//             } );

//             after( function() {
//               index.__get__( 'config' ).lengthLimit = bkpLengthLimit;
//             } );

//             it( 'should destroy the external response', function() {
//               fakeExternalResponse.destroy.reset();
//               externalCallback( fakeExternalResponse );
//               expect( fakeExternalResponse.destroy ).to.have.been.calledOnce;
//             } );

//             it( 'should return a 404 response', function() {
//               index.__get__( 'fourOhFour' ).reset();
//               var result = externalCallback( fakeExternalResponse );
//               expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//               expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Content-Length exceeded' );
//               expect( result ).to.be.equal( 'return from fourOhFour' );
//             } );
//           } );

//           describe( 'and external response DID NOT exceeded size limit', function() {

//             describe( 'when external response ends', function() {
//               var restoreFinish;

//               before( function() {
//                 restoreFinish = index.__set__( 'finish', sinon.stub() );
//                 index.__get__( 'finish' ).returns( 'return finished' );
//               } );

//               after( function() {
//                 restoreFinish();
//               } );

//               describe( 'and is flagged to finish', function() {
//                 var endCallback,
//                     bkpStatusCode;

//                 before( function() {
//                   fakeExternalResponse.on.reset();
//                   bkpStatusCode = fakeExternalResponse.statusCode;

//                   // 200 will keep the isFinish flag equal to true
//                   fakeExternalResponse.statusCode = 200;

//                   externalCallback( fakeExternalResponse );
//                   endCallback = fakeExternalResponse.on.getCall( 0 );
//                   // this following is just to make sure I got the right call
//                   expect( endCallback ).to.be.calledWith( 'end', sinon.match.func );
//                   endCallback = endCallback.args[ 1 ];
//                 } );

//                 after( function() {
//                   fakeExternalResponse.statusCode = bkpStatusCode;
//                 } );

//                 it( 'should finish the response', function() {
//                   index.__get__( 'finish' ).reset();
//                   endCallback()
//                   expect( index.__get__( 'finish' ) ).to.have.been.calledOnce;
//                 } );
//               } );

//               describe( 'and is NOT flagged to finish', function() {
//                 var endCallback,
//                     bkpStatusCode;

//                 before( function() {
//                   fakeExternalResponse.on.reset();
//                   bkpStatusCode = fakeExternalResponse.statusCode;

//                   // 301 with a couple of other conditions will set isFinish to false
//                   fakeExternalResponse.statusCode = 301;

//                   externalCallback( fakeExternalResponse );
//                   endCallback = fakeExternalResponse.on.getCall( 0 );
//                   // this following is just to make sure I got the right call
//                   expect( endCallback ).to.be.calledWith( 'end', sinon.match.func );
//                   endCallback = endCallback.args[ 1 ];
//                 } );

//                 after( function() {
//                   fakeExternalResponse.statusCode = bkpStatusCode;
//                 } );

//                 it( 'should NOT finish the response', function() {
//                   index.__get__( 'finish' ).reset();
//                   endCallback()
//                   expect( index.__get__( 'finish' ) ).not.to.have.been.called;
//                 } );
//               } );
//             } );

//             describe( 'when external response fails', function() {
//               var restoreFinish;

//               before( function() {
//                 restoreFinish = index.__set__( 'finish', sinon.stub() );
//                 index.__get__( 'finish' ).returns( 'return finished' );
//               } );

//               after( function() {
//                 restoreFinish();
//               } );

//               describe( 'and is flagged to finish', function() {
//                 var errCallback,
//                     bkpStatusCode;

//                 before( function() {
//                   fakeExternalResponse.on.reset();
//                   bkpStatusCode = fakeExternalResponse.statusCode;

//                   // 200 will keep the isFinish flag equal to true
//                   fakeExternalResponse.statusCode = 200;

//                   externalCallback( fakeExternalResponse );
//                   errCallback = fakeExternalResponse.on.getCall( 1 );
//                   // this following is just to make sure I got the right call
//                   expect( errCallback ).to.be.calledWith( 'error', sinon.match.func );
//                   errCallback = errCallback.args[ 1 ];
//                 } );

//                 after( function() {
//                   fakeExternalResponse.statusCode = bkpStatusCode;
//                 } );

//                 it( 'should finish the response', function() {
//                   index.__get__( 'finish' ).reset();
//                   errCallback()
//                   expect( index.__get__( 'finish' ) ).to.have.been.calledOnce;
//                 } );
//               } );

//               describe( 'and is NOT flagged to finish', function() {
//                 var errCallback,
//                     bkpStatusCode;

//                 before( function() {
//                   fakeExternalResponse.on.reset();
//                   bkpStatusCode = fakeExternalResponse.statusCode;

//                   // 301 with a couple of other conditions will set isFinish to false
//                   fakeExternalResponse.statusCode = 301;

//                   externalCallback( fakeExternalResponse );
//                   errCallback = fakeExternalResponse.on.getCall( 1 );
//                   // this following is just to make sure I got the right call
//                   expect( errCallback ).to.be.calledWith( 'error', sinon.match.func );
//                   errCallback = errCallback.args[ 1 ];
//                 } );

//                 after( function() {
//                   fakeExternalResponse.statusCode = bkpStatusCode;
//                 } );

//                 it( 'should NOT finish the response', function() {
//                   index.__get__( 'finish' ).reset();
//                   errCallback()
//                   expect( index.__get__( 'finish' ) ).not.to.have.been.called;
//                 } );
//               } );
//             } );

//             describe( 'when etag is received from external', function() {
//               var bkpEtag;

//               before( function() {
//                 bkpEtag = fakeExternalResponse.headers.etag;
//                 fakeExternalResponse.headers.etag = 'etag value';
//               } );

//               after( function() {
//                 fakeExternalResponse.headers.etag = bkpEtag;
//               } );

//               it( 'should set etag to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ].etag ).to.be.equal( 'etag value' );
//               } );
//             } );

//             describe( 'when expires is received from external', function() {
//               var bkpExpires;

//               before( function() {
//                 bkpExpires = fakeExternalResponse.headers.expires;
//                 fakeExternalResponse.headers.expires = 'expires value';
//               } );

//               after( function() {
//                 fakeExternalResponse.headers.expires = bkpExpires;
//               } );

//               it( 'should set expires to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ].expires ).to.be.equal( 'expires value' );
//               } );
//             } );

//             describe( 'when last-modified is received from external', function() {
//               var bkpLastModified;

//               before( function() {
//                 bkpLastModified = fakeExternalResponse.headers[ 'last-modified' ];
//                 fakeExternalResponse.headers[ 'last-modified' ] = 'last-modified value';
//               } );

//               after( function() {
//                 fakeExternalResponse.headers[ 'last-modified' ] = bkpLastModified;
//               } );

//               it( 'should set last-modified to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'last-modified' ] ).to.be.equal( 'last-modified value' );
//               } );
//             } );

//             describe( 'when timingOrigin config is defined', function() {
//               var bkpTimingOrigin;

//               before( function() {
//                 bkpTimingOrigin = index.__get__( 'config' ).timingOrigin;
//                 index.__get__( 'config' ).timingOrigin = 'timingOrigin value';
//               } );

//               after( function() {
//                 index.__get__( 'config' ).timingOrigin = bkpTimingOrigin;
//               } );

//               it( 'should set Timing-Allow-Origin to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'Timing-Allow-Origin' ] ).to.be.equal( 'timingOrigin value' );
//               } );
//             } );

//             describe( 'when content-length is received from external', function() {
//               var bkpContentLength;

//               before( function() {
//                 bkpContentLength = fakeExternalResponse.headers[ 'content-length' ];
//                 fakeExternalResponse.headers[ 'content-length' ] = 'content-length value';
//               } );

//               after( function() {
//                 fakeExternalResponse.headers[ 'content-length' ] = bkpContentLength;
//               } );

//               it( 'should set content-length to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'content-length' ] ).to.be.equal( 'content-length value' );
//               } );
//             } );

//             describe( 'when transfer-encoding is received from external', function() {
//               var bkpTransferEncoding;

//               before( function() {
//                 bkpTransferEncoding = fakeExternalResponse.headers[ 'transfer-encoding' ];
//                 fakeExternalResponse.headers[ 'transfer-encoding' ] = 'transfer-encoding value';
//               } );

//               after( function() {
//                 fakeExternalResponse.headers[ 'transfer-encoding' ] = bkpTransferEncoding;
//               } );

//               it( 'should set transfer-encoding to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'transfer-encoding' ] ).to.be.equal( 'transfer-encoding value' );
//               } );
//             } );

//             describe( 'when content-encoding is received from external', function() {
//               var bkpContentEncoding;

//               before( function() {
//                 bkpContentEncoding = fakeExternalResponse.headers[ 'content-encoding' ];
//                 fakeExternalResponse.headers[ 'content-encoding' ] = 'content-encoding value';
//               } );

//               after( function() {
//                 fakeExternalResponse.headers[ 'content-encoding' ] = bkpContentEncoding;
//               } );

//               it( 'should set content-encoding to the response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'content-encoding' ] ).to.be.equal( 'content-encoding value' );
//               } );
//             } );

//             describe( 'when external response gets a redirect', function() {
//               var bkpStatusCode;
//               before( function() {
//                 bkpStatusCode = fakeExternalResponse.statusCode;
//                 fakeExternalResponse.statusCode = 301; // todo: verify if i have to test: 302/303/307/308
//               } );

//               after( function() {
//                 fakeExternalResponse.statusCode = bkpStatusCode;
//               } );

//               it( 'should destroy the external response', function() {
//                 fakeExternalResponse.destroy.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeExternalResponse.destroy ).to.have.been.calledOnce;
//               } );

//               describe( 'when maximum redirects was reached', function() {
//                 var externalCallback2;

//                 before( function() {
//                   restoreProcessUrl();
//                   index.__get__( 'Http' ).get.reset();
//                   index.__get__( 'processUrl' )( urlTest, {}, fakeResponse, 0 );
//                   externalCallback2 = index.__get__( 'Http' ).get.getCall( 0 ).args[ 1 ];
//                   restoreProcessUrl = index.__set__( 'processUrl', sinon.stub() );
//                 } );

//                 it( 'should return a 404 response', function() {
//                   index.__get__( 'fourOhFour' ).reset();
//                   externalCallback2( fakeExternalResponse );
//                   expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//                   expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Exceeded max depth' );
//                 } );
//               } );

//               describe( 'when the redirect response does NOT contain a location', function() {
//                 var bkpLocation;

//                 before( function() {
//                   bkpLocation = fakeExternalResponse.headers.location;
//                   fakeExternalResponse.headers.location = void 0;
//                 } );

//                 after( function() {
//                   fakeExternalResponse.headers.location = bkpLocation;
//                 } );

//                 it( 'should return a 404 response', function() {
//                   index.__get__( 'fourOhFour' ).reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//                   expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Redirect with no location' );
//                 } );
//               } );

//               describe( 'when maximum redirects was NOT reached and it contains a location', function() {
//                 var bkpLocation;

//                 before( function() {
//                   // maximum is set to 3 based on the startup of the parent
//                   bkpLocation = fakeExternalResponse.headers.location;
//                   fakeExternalResponse.headers.location = 'http://new-domain.com/some/path';
//                 } );

//                 after( function() {
//                   fakeExternalResponse.headers.location = bkpLocation;
//                 } );

//                 describe( 'when the location does NOT have a host', function() {
//                   var bkpParse;

//                   before( function() {
//                     bkpParse = index.__get__( 'Url' ).parse();
//                     index.__get__( 'Url' ).parse.returns( {
//                       'protocol': 'http:',
//                       'port': 80,
//                       'format': function(){}
//                     } );
//                   } );

//                   after( function() {
//                     index.__get__( 'Url' ).parse.returns( bkpParse );
//                   } );

//                   it( 'should use the host of the current external request', function() {
//                     index.__get__( 'processUrl' ).reset();
//                     externalCallback( fakeExternalResponse );
//                     expect( index.__get__( 'processUrl' ) ).to.have.been.calledOnce;
//                     expect( index.__get__( 'processUrl' ).getCall( 0 ).args[ 0 ].host ).to.be.equal( 'www.some-domain.com' );
//                   } );
//                 } );

//                 describe( 'when the location does have a host', function() {
//                   var bkpParse;

//                   before( function() {
//                     bkpParse = index.__get__( 'Url' ).parse();
//                     index.__get__( 'Url' ).parse.returns( {
//                       'host': 'new-domain.com',
//                       'hostname': 'new-domain.com',
//                       'protocol': 'http:',
//                       'port': 80,
//                       'format': function(){}
//                     } );
//                   } );

//                   after( function() {
//                     index.__get__( 'Url' ).parse.returns( bkpParse );
//                   } );

//                   it( 'should use received host', function() {
//                     index.__get__( 'processUrl' ).reset();
//                     externalCallback( fakeExternalResponse );
//                     expect( index.__get__( 'processUrl' ) ).to.have.been.calledOnce;
//                     expect( index.__get__( 'processUrl' ).getCall( 0 ).args[ 0 ].host ).to.be.equal( 'new-domain.com' );
//                   } );
//                 } );

//                 it( 'should request the new location', function() {
//                   index.__get__( 'processUrl' ).reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( index.__get__( 'processUrl' ) ).to.have.been.calledOnce;
//                   expect( index.__get__( 'processUrl' ).getCall( 0 ).args[ 3 ] ).to.be.equal( 2 );
//                 } );
//               } );
//             } );

//             describe( 'when external response gets a not modified', function() {
//               var bkpStatusCode;

//               before( function() {
//                 bkpStatusCode = fakeExternalResponse.statusCode;
//                 fakeExternalResponse.statusCode = 304;
//               } );

//               after( function() {
//                 fakeExternalResponse.statusCode = bkpStatusCode;
//               } );

//               it( 'should destroy the current external response', function() {
//                 fakeExternalResponse.destroy.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeExternalResponse.destroy ).to.have.been.calledOnce;
//               } );

//               it( 'should send back a not modified response', function() {
//                 fakeResponse.writeHead.reset();
//                 externalCallback( fakeExternalResponse );
//                 expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                 expect( fakeResponse.writeHead.getCall( 0 ).args[ 0 ] ).to.be.equal( 304 );
//               } );
//             } );

//             describe( 'when external response is not a redirect and is fresh', function() {
//               var bkpStatusCode;

//               before( function() {
//                 bkpStatusCode = fakeExternalResponse.statusCode;
//                 fakeExternalResponse.statusCode = 200;
//               } );

//               after( function() {
//                 fakeExternalResponse.statusCode = bkpStatusCode;
//               } );

//               describe( 'and NO content-type was sent', function() {
//                 var bkpContentType;

//                 before( function() {
//                   bkpContentType = fakeExternalResponse.headers[ 'content-type' ];
//                   fakeExternalResponse.headers[ 'content-type' ] = void 0;
//                 } );

//                 after( function() {
//                   fakeExternalResponse.headers[ 'content-type' ] = bkpContentType;
//                 } );

//                 it( 'should destroy the external response', function() {
//                   fakeExternalResponse.destroy.reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( fakeExternalResponse.destroy ).to.have.been.calledOnce;
//                 } );

//                 it( 'should return a 404 response', function() {
//                   index.__get__( 'fourOhFour' ).reset();
//                   var result = externalCallback( fakeExternalResponse );
//                   expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//                   expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'No content-type returned' );
//                 } );
//               } );

//               describe( 'when the content-type is not a valid media type', function() {
//                 var bkpContentType;

//                 before( function() {
//                   bkpContentType = fakeExternalResponse.headers[ 'content-type' ];
//                   fakeExternalResponse.headers[ 'content-type' ] = 'invalid/type';
//                 } );

//                 after( function() {
//                   fakeExternalResponse.headers[ 'content-type' ] = bkpContentType;
//                 } );

//                 it( 'should destroy the external response', function() {
//                   fakeExternalResponse.destroy.reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( fakeExternalResponse.destroy ).to.have.been.calledOnce;
//                 } );

//                 it( 'should return a 404 response', function() {
//                   index.__get__( 'fourOhFour' ).reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( index.__get__( 'fourOhFour' ) ).to.have.been.calledOnce;
//                   expect( index.__get__( 'fourOhFour' ).getCall( 0 ).args[ 1 ] ).to.be.equal( 'Non-Image content-type returned \'invalid/type\'' );
//                 } );
//               } );

//               describe( 'when content-type defined and valid', function() {
//                 var bkpContentType;

//                 before( function() {
//                   bkpContentType = fakeExternalResponse.headers[ 'content-type' ];
//                   fakeExternalResponse.headers[ 'content-type' ] = 'image/png';
//                 } );

//                 after( function() {
//                   fakeExternalResponse.headers[ 'content-type' ] = bkpContentType;
//                 } );

//                 it( 'should write the main response', function() {
//                   fakeResponse.writeHead.reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( fakeResponse.writeHead ).to.have.been.calledOnce;
//                   expect( fakeResponse.writeHead.getCall( 0 ).args[ 0 ] ).to.be.equal( 200 );
//                   expect( fakeResponse.writeHead.getCall( 0 ).args[ 1 ][ 'content-type' ] ).to.be.equal( 'image/png' );
//                 } );

//                 it( 'should make sure the external response finishes before the main response', function() {
//                   fakeExternalResponse.pipe.reset();
//                   externalCallback( fakeExternalResponse );
//                   expect( fakeExternalResponse.pipe ).to.have.been.calledOnce;
//                   expect( fakeExternalResponse.pipe.getCall( 0 ).args[ 0 ] ).to.be.equal( fakeResponse );
//                 } );

//               } );
//             } );
//           } );

//         } );

//       } );

//     } );
//   } );
// } );

