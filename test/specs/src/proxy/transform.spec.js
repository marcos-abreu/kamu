'use strict';

require( '../../../common' );

describe( 'proxy transform', function() {
  var transform;

  before( function() {
    transform = rewire( '../src/proxy/transform' );

    transform.__set__( {
      'log'         : {
        'debug'       : sinon.stub(),
        'warn'        : sinon.stub(),
        'error'       : sinon.stub()
      },
      'utils'       : {
        'fourOhFour'  : sinon.stub(),
        'fiveHundred' : sinon.stub(),
        'finish'      : sinon.stub()
      }
    } );

  } );

  describe( '#parseUrl', function() {
    var str;

    before( function() {
      str = 's_fit,w_100,h_150';
    } );

    describe( 'when string does NOT contain commas', function() {
      it( 'should treat the entire string as one item', function() {
        var result = transform.parseUrl( 's_fit_w_100_h_150' );
        expect( result.s ).to.be.equal( 'fit' );
        expect( result.w ).to.be.undefined;
        expect( result.h ).to.be.undefined;
      } );

      describe( 'and string does NOT contain underscores', function() {
        it( 'should ignore the entire string', function() {
          var result = transform.parseUrl( 's-fit-w-100-h-150' );
          expect( result ).to.be.undefined;
        } );
      } );
    } );

    it( 'should break the string into items using commas as a separator', function() {
      var result = transform.parseUrl( 's_fit,w_100,h_150' );
      expect( result ).to.contain.keys( [ 's', 'w', 'h' ] );
    } );

    it( 'should break the items into keys and values using underscores as separator', function() {
      var result = transform.parseUrl( 's_fit,w_100,h_150' );
      expect( result.s ).to.be.equal( 'fit' );
      expect( result.w ).to.be.equal( '100' );
      expect( result.h ).to.be.equal( '150' );
    } );

    describe( 'when key is not a valid transform key', function() {
      it( 'should ignore the item', function() {
        var result = transform.parseUrl( 's_fit,w_100,h_150,invalid_somevalue' );
        expect( result.s ).to.be.equal( 'fit' );
        expect( result.w ).to.be.equal( '100' );
        expect( result.h ).to.be.equal( '150' );
        expect( result ).not.to.contain.key( 'invalid' );
      } );
    } );
  } );

  describe( '#parseQS', function() {
    it( 'should only pick the valid transform keys from the querystring object', function() {
      var result = transform.parseQS( { 'invalid': 'somevalue', 's': 'fit', 'w': '100', 'h': '150' } );
      expect( result ).to.contain.keys( 's', 'w', 'h' );
      expect( result ).not.to.contain.key( 'invalid' );
    } );
  } );

  describe( '#transformMedia', function() {
    var fakeSharp,
        options;

    before( function() {
      fakeSharp = {
        'withoutEnlargement'      : sinon.stub(),
        'resize'                  : sinon.stub(),
        'max'                     : sinon.stub(),
        'min'                     : sinon.stub(),
        'extract'                 : sinon.stub(),
        'rotate'                  : sinon.stub(),
        'flip'                    : sinon.stub(),
        'flop'                    : sinon.stub(),
        'ignoreAspectRatio'       : sinon.stub(),
        'quality'                 : sinon.stub(),
        'toFormat'                : sinon.stub()
      };

      options = {
        '__sharpLib' : function() {
          return fakeSharp;
        }
      };
    } );

    describe( 'when withoutEnlargement configuration is true', function() {
      var bkpTWithoutEnlargement;

      before( function() {
        bkpTWithoutEnlargement = transform.__get__( 'config' ).transformWithoutEnlargement;
        transform.__get__( 'config' ).transformWithoutEnlargement = true;
      } );

      after( function() {
        transform.__get__( 'config' ).transformWithoutEnlargement = bkpTWithoutEnlargement;
      } );

      it( 'should activate the withoutEnlargement for the transform instance', function() {
        fakeSharp.withoutEnlargement.reset();
        transform.__get__( 'transformMedia' )( options );
        expect( fakeSharp.withoutEnlargement ).to.have.been.calledOnce;
      } );
    } );

    describe( 'when more than one resize operation is informed', function() {
      before( function() {
        options.s = 'scale';
        options.w = '100';
        options.h = '150';

        // todo: verify if it is possible to define a second resize operation
      } );

      after( function() {
        delete options.s;
        delete options.w;
        delete options.h;
      } );

      it.skip( 'should only process the first valid operation', function() {

      } );
    } );

    describe( 'when scaling', function() {
      before( function() {
        options.s = 'scale';
      } );

      after( function() {
        delete options.s;
      } );

      describe( 'and neither width or height is informed', function() {
        it( 'should ignore the scaling operation', function() {
          fakeSharp.resize.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.resize ).not.to.have.been.called;
        } );
      } );

      describe( 'and both width and height are informed', function() {
        before( function() {
          options.w = '100';
          options.h = '150';
        } );

        after( function() {
          delete options.w;
          delete options.h;
        } );

        it( 'should resize ignoring the image aspect ratio', function() {
          fakeSharp.ignoreAspectRatio.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.ignoreAspectRatio ).to.have.been.calledOnce;
        } );
      } );
    } );

    describe( 'when scaling image to fit a bounding box', function() {
      before( function() {
        options.s = 'fit';
      } );

      after( function() {
        delete options.s;
      } );

      describe( 'and either width or height is not informed', function() {
        before( function() {
          options.w = '100';
        } );

        after( function() {
          delete options.w;
        } );

        it( 'should ignore the fit scaling operation', function() {
          fakeSharp.max.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.max ).not.to.have.been.called;
        } );

        it( 'should set the default scale operation', function() {
          fakeSharp.resize.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.resize ).to.have.been.calledOnce;
        } );
      } );

      describe( 'and both width and height are informed', function() {
        before( function() {
          options.w = '100';
          options.h = '150';
        } );

        after( function() {
          delete options.w;
          delete options.h;
        } );

        it( 'should set the fit scale operation', function() {
          fakeSharp.max.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.max ).to.have.been.calledOnce;
        } );
      } );
    } );

    describe( 'when scaling image to fill a bounding box', function() {
      before( function() {
        options.s = 'fill';
      } );

      after( function() {
        delete options.s;
      } );

      describe( 'and either width or height is not informed', function() {
        before( function() {
          options.w = '100';
        } );

        after( function() {
          delete options.w;
        } );

        it( 'should ignore the fill scaling operation', function() {
          fakeSharp.min.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.min ).not.to.have.been.called;
        } );

        it( 'should set the default scalling operation', function() {
          fakeSharp.resize.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.resize ).to.have.been.calledOnce;
        } );
      } );

      describe( 'when both width and height are informed', function() {
        before( function() {
          options.w = '100';
          options.h = '150';
        } );

        after( function() {
          delete options.w;
          delete options.h;
        } );

        it( 'should set the fill scale operation', function() {
          fakeSharp.min.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.min ).to.have.been.calledOnce;
        } );
      } );
    } );

    describe( 'when extract operation is required', function() {
      before( function() {
        options.x = 'crop';
      } );

      after( function() {
        delete options.x;
      } );

      describe.skip( 'and another valid extract operation was already setup', function() {
        it( 'should ignore the second extract operation', function() {

        } );
      } );

      describe( 'and the extract operation IS NOT set to crop', function() {
        var bkpExtract;

        before( function() {
          bkpExtract = options.x;
          options.x = 'someOtherExtractValue';
        } );

        after( function() {
          options.x = bkpExtract;
        } );

        it( 'should ignore the extract operation', function() {
          fakeSharp.extract.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.extract ).not.to.have.been.called;
        } );
      } );

      describe( 'and either extract width or extract height is not informed', function() {
        before( function() {
          options.xw = '100';
        } );

        it( 'should ignore the extract operation', function() {
          fakeSharp.extract.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.extract ).not.to.have.been.called;
        } );

        it( 'should not set the default scaling operation', function() {
          fakeSharp.resize.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.resize ).not.to.have.been.called;
        } );
      } );

      describe( 'when both extract width and extract height are informed', function() {
        before( function() {
          options.xw = '100';
          options.xh = '150';
        } );

        after( function() {
          delete options.xw;
          delete options.xh;
        } );

        it( 'should set the extract operation', function() {
          fakeSharp.extract.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.extract ).to.have.been.calledOnce;
        } );
      } );
    } );
    
    describe( 'when rotate operation is required', function() {
      before( function() {
        options.r = '180';
      } );

      after( function() {
        delete options.r;
      } );

      describe.skip( 'and another valid rotate operation was already setup', function() {
        it( 'should ignore the second rotate operation', function() {

        } );
      } );

      describe( 'and the rotate angle is not a valid predefined angle', function() {
        before( function() {
          options.r = 110;
        } );

        after( function() {
          delete options.r;
        } );

        it( 'should ignore the rotate operation', function() {
          fakeSharp.rotate.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.rotate ).not.to.have.been.calledOnce;
        } );
      } );

      describe( 'and rotate angle is a valid predifined angle', function() {
        before( function() {
          options.r = '180';
        } );

        after( function() {
          delete options.r;
        } );

        it( 'should set the rotate operation', function() {
          fakeSharp.rotate.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.rotate ).to.have.been.calledOnce;
        } );
      } );
    } );

    describe( 'when mirror operation is required', function() {
      before( function() {
        options.m = 'flip';
      } );

      after( function() {
        delete options.m;
      } );

      describe.skip( 'and another valid mirror operation was already setup', function() {
        it( 'should ignore the second mirror operation', function() {

        } );
      } );

      describe( 'and the mirror operation value is neighter flip or flop', function() {
        var bkpMirror;

        before( function() {
          bkpMirror = options.m;
          options.m = 'invalidMirrorValue';
        } );

        after( function() {
          options.m = bkpMirror;
        } );

        it( 'should ignore the mirror operation', function() {
          fakeSharp.flip.reset();
          fakeSharp.flop.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.flip ).not.to.have.been.called;
          expect( fakeSharp.flop ).not.to.have.been.called;
        } );
      } );

      describe( 'set to "flip"', function() {
        var bkpMirror;

        before( function() {
          bkpMirror = options.m;
          options.m = 'flip';
        } );

        after( function() {
          options.m = bkpMirror;
        } );

        it( 'should set the mirror flip operation', function() {
          fakeSharp.flip.reset();
          fakeSharp.flop.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.flip ).to.have.been.calledOnce;
          expect( fakeSharp.flop ).not.to.have.been.called;
        } );
      } );

      describe( 'set to "flop"', function() {
        var bkpMirror;

        before( function() {
          bkpMirror = options.m;
          options.m = 'flop';
        } );

        after( function() {
          options.m = bkpMirror;
        } );

        it( 'should set the mirror flop operation', function() {
          fakeSharp.flop.reset();
          fakeSharp.flip.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.flop ).to.have.been.calledOnce;
          expect( fakeSharp.flip ).not.to.have.been.called;
        } );
      } );
    } );

    describe( 'when no scaling or extract operation is set', function() {
      before( function() {
        // the following is just in case of some test leak
        delete options.s;
        delete options.x;
      } );

      describe( 'and yet either width or height is informed', function() {
        before( function() {
          options.w = '100';
        } );

        after( function() {
          delete options.w;
        } );

        it( 'should default to a scale operation', function() {
          fakeSharp.resize.reset();
          fakeSharp.max.reset();
          fakeSharp.min.reset();
          fakeSharp.extract.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.resize ).to.have.been.calledOnce;
          expect( fakeSharp.max ).not.to.have.been.called;
          expect( fakeSharp.min ).not.to.have.been.called;
          expect( fakeSharp.extract ).not.to.have.been.called;
        } );
      } );

      describe( 'and both width and height are informed', function() {
        before( function() {
          options.w = '100';
          options.h = '150';
        } );

        after( function() {
          delete options.w;
          delete options.h;
        } );

        it( 'should scale ignoring the aspect ratio', function() {
          fakeSharp.ignoreAspectRatio.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.ignoreAspectRatio ).to.have.been.calledOnce;
        } );
      } );
    } );

    describe( 'when quality is informed', function() {
      before( function() {
        options.q = '80';
      } );

      after( function() {
        delete options.q;
      } );

      describe( 'but the quality value is outside of the valid range 1-100', function() {
        var bkpQuality;

        before( function() {
          bkpQuality = options.q;
          options.q = 101;
        } );

        after( function() {
          options.q = bkpQuality;
        } );

        it( 'should ignore the operation', function() {
          fakeSharp.quality.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.quality ).not.to.have.been.called;
        } );
      } );

      it( 'should set the quality operation', function() {
        fakeSharp.quality.reset();
        transform.__get__( 'transformMedia' )( options );
        expect( fakeSharp.quality ).to.have.been.calledOnce;
      } );
    } );

    describe( 'when output format is defined', function() {
      before( function() {
        options.f = 'webp';
      } );

      after( function() {
        delete options.f;
      } );

      describe( 'and format is not a valid output format', function() {
        var bkpFormat;

        before( function() {
          bkpFormat = options.f;
          options.f = 'invalidFormat';
        } );

        after( function() {
          options.f = bkpFormat;
        } );

        it( 'should ignore the operation', function() {
          fakeSharp.toFormat.reset();
          transform.__get__( 'transformMedia' )( options );
          expect( fakeSharp.toFormat ).not.to.have.been.called;
        } );
      } );

      it( 'should set the format operation', function() {
        fakeSharp.toFormat.reset();
        transform.__get__( 'transformMedia' )( options );
        expect( fakeSharp.toFormat ).to.have.been.calledOnce;
      } );
    } );

    it( 'should return the transform instance', function() {
      var result = transform.__get__( 'transformMedia' )( options );
      expect( result ).to.be.equal( fakeSharp );
    } );
  } );


  describe( '#getTransformer', function() {
    var endCallback,
        errorCallback,
        fakeTransformer,
        res,
        mediaRes,
        options,
        reqUrl,
        mediaUrl,
        revert;

    before( function() {
      res = {
        _media: {},
        writeHead: sinon.stub()
      };
      mediaRes = {
        destroy: sinon.stub()
      };
      options = {};
      reqUrl = 'http://kamu-host.com/encoded-key/encoded-url/s_fit,w_100,h_150';
      mediaUrl = 'http://some-host.com/path/to/image.jpg';

      fakeTransformer = {
        on: function( event, callback ) {
          if ( event === 'error' ) {
            errorCallback = callback;
          }
          else if ( event === 'end' ) {
            endCallback = callback;
          }
        }
      };

      revert = transform.__set__( 'transformMedia', sinon.stub().returns( fakeTransformer ) );
    } );

    after( function() {
      revert();
    } );

    it( 'should create a transformer instance', function() {
      transform.__get__( 'transformMedia' ).reset();
      transform.getTransformer( res, mediaRes, options, reqUrl, mediaUrl );
      expect( transform.__get__( 'transformMedia' ) ).to.have.been.calledOnce;
    } );

    describe( 'when fails to create a transformer instance', function() {
      before( function() {
        transform.__set__( 'transformMedia', sinon.stub().throws() );
      } );

      after( function() {
        transform.__set__( 'transformMedia', sinon.stub().returns( fakeTransformer ) );
      } );

      it( 'should log an error', function() {
        transform.__get__( 'log' ).error.reset();
        transform.getTransformer( res, mediaRes, options, reqUrl, mediaUrl );
        expect( transform.__get__( 'log' ).error ).to.have.been.calledOnce;
      } );
    } );

    it( 'should return the transformer instance', function() {
      var result = transform.getTransformer( res, mediaRes, options, reqUrl, mediaUrl );
      expect( result ).to.be.equal( fakeTransformer );
    } );

    describe( 'end event', function() {
      before( function() {
        endCallback = void 0;
        transform.getTransformer( res, mediaRes, options, reqUrl, mediaUrl );
      } );

      after( function() {
        endCallback = void 0;
        res._media = {};
      } );

      it( 'should flag the end of pending tranform', function() {
        res._media.pendingTransform = true;
        endCallback( 'some error' );
        expect( res._media.pendingTransform ).to.be.equal( false );
      } );

      describe( 'when media request is finished', function() {
        before( function() {
          res._media.finished = true;
        } );

        after( function() {
          delete res._media.finished;
        } );

        describe( 'and there was a transform error', function() {
          before( function() {
            res._media.finished = true;
            res._media.transformError = true;
          } );

          after( function() {
            delete res._media.finished;
            delete res._media.transformError;
          } );

          it( 'should NOT finish the main response', function() {
            transform.__get__( 'utils' ).finish.reset();
            endCallback( 'some error' );
            expect( transform.__get__( 'utils' ).finish ).not.to.have.been.called;
          } );
        } );

        it( 'should finish the main response', function() {
          transform.__get__( 'utils' ).finish;
          endCallback( 'some error' );
          expect( transform.__get__( 'utils' ).finish ).to.have.been.calledOnce;
        } );
      } );
    } );

    describe( 'error event', function() {
      it( 'should destroy the media response', function() {
        mediaRes.destroy.reset();
        errorCallback( 'Some Error' );
        expect( mediaRes.destroy ).to.have.been.calledOnce;
      } );

      describe( 'when transform redirect on error is set to FALSE', function() {
        var bkpTransRedirectOnError;

        before( function() {
          bkpTransRedirectOnError = transform.__get__( 'config' ).transformRedirectOnError;
          transform.__get__( 'config' ).transformRedirectOnError = false;
        } );

        after( function() {
          transform.__get__( 'config' ).transformRedirectOnError = bkpTransRedirectOnError;
        } );

        it( 'should return a 500 response', function() {
          transform.__get__( 'utils' ).fiveHundred.reset();
          errorCallback( 'Some Error' );
          expect( transform.__get__( 'utils' ).fiveHundred ).to.have.been.calledOnce;
        } );
      } );

      describe( 'when transform redirect on error is set to TRUE', function() {
        var bkpTransRedirectOnError;

        before( function() {
          bkpTransRedirectOnError = transform.__get__( 'config' ).transformRedirectOnError;
          transform.__get__( 'config' ).transformRedirectOnError = true;
        } );

        after( function() {
          transform.__get__( 'config' ).transformRedirectOnError = bkpTransRedirectOnError;
        } );

        it( 'should log the error', function() {
          transform.__get__( 'log' ).error.reset();
          errorCallback( 'Some Error' );
          expect( transform.__get__( 'log' ).error ).to.have.been.calledOnce;
        } );

        it( 'should redirect to a url with NO transition parameters', function() {
          res.writeHead.reset();
          errorCallback( 'Some Error' );
          expect( res.writeHead ).to.have.been.calledOnce;
          expect( res.writeHead.getCall( 0 ).args[ 1 ].Location ).to.be.equal( 'http://kamu-host.com/encoded-key/encoded-url' );
        } );

        it( 'should finish the current response', function() {
          transform.__get__( 'utils' ).finish.reset();
          errorCallback( 'Some Error' );
          expect( transform.__get__( 'utils' ).finish ).to.have.been.calledOnce;
        } );
      } );
    } );
  } );
} );