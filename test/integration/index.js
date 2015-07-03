'use strict';

require( '../common' );

var http      = require( 'http' ),
    Url       = require( 'url' ),
    proxyUrl  = require( '../../demo/utils' ).proxyUrl,
    server;

var proxyPath = function( externalUrl ) {
  var url;

  if ( externalUrl == null ) {
    return '';
  }
  url = Url.parse( proxyUrl( externalUrl ) );
  return url.path;
};

describe( 'app integration ->', function() {
  var req,
      reqOptions;

  before( function( done ) {
    server = require( '../../index' );
    server.on( 'listening', done );
    reqOptions = {
      hostname : 'localhost',
      port: '8081',
      path: '/'
    };
  } );

  after( function( done ) {
    server.close( done );
  } );

  describe( 'post requests', function() {
    var bkpMethod;

    before( function() {
      bkpMethod = reqOptions.method;
      reqOptions.method = 'POST';
    } );

    after( function() {
      reqOptions.method = bkpMethod;
    } );

    it( 'should return a 200 response', function( done ) {
      req = http.request( reqOptions, function( res ) {
        expect( res.statusCode ).to.be.equal( 200 );
        done();
      } );
      req.end(); // necessary when using http.request
    } );

    it( 'should only contain the string `hwhat` as the body', function( done ) {
      req = http.request( reqOptions, function( res ) {
        res.setEncoding( 'utf8' ); // necessary to read data as plain text
        res.on( 'data', function( body ) {
          expect( body ).to.contain( 'hwhat' );
          done();
        } );
      } );
      req.end(); // necessary when using http.request
    } );
  } );

  describe( 'put requests', function() {
    var bkpMethod;

    before( function() {
      bkpMethod = reqOptions.method;
      reqOptions.method = 'PUT';
    } );

    after( function() {
      reqOptions.method = bkpMethod;
    } );

    it( 'should return a 200 response', function( done ) {
      req = http.request( reqOptions, function( res ) {
        expect( res.statusCode ).to.be.equal( 200 );
        done();
      } );
      req.end(); // necessary when using http.request
    } );

    it( 'should only contain the string `hwhat` as the body', function( done ) {
      req = http.request( reqOptions, function( res ) {
        res.setEncoding( 'utf8' ); // necessary to read data as plain text
        res.on( 'data', function( body ) {
          expect( body ).to.contain( 'hwhat' );
          done();
        } );
      } );
      req.end(); // necessary when using http.request
    } );
  } );

  describe( 'delete requests', function() {
    var bkpMethod;

    before( function() {
      bkpMethod = reqOptions.method;
      reqOptions.method = 'DELETE';
    } );

    after( function() {
      reqOptions.method = bkpMethod;
    } );

    it( 'should return a 200 response', function( done ) {
      req = http.request( reqOptions, function( res ) {
        expect( res.statusCode ).to.be.equal( 200 );
        done();
      } );
      req.end(); // necessary when using http.request
    } );

    it( 'should only contain the string `hwhat` as the body', function( done ) {
      req = http.request( reqOptions, function( res ) {
        res.setEncoding( 'utf8' ); // necessary to read data as plain text
        res.on( 'data', function( body ) {
          expect( body ).to.contain( 'hwhat' );
          done();
        } );
      } );
      req.end(); // necessary when using http.request
    } );
  } );

  describe( 'head requests', function() {
    var bkpMethod;

    before( function() {
      bkpMethod = reqOptions.method;
      reqOptions.method = 'HEAD';
    } );

    after( function() {
      reqOptions.method = bkpMethod;
    } );

    it( 'should return a 200 response', function( done ) {
      req = http.request( reqOptions, function( res ) {
        expect( res.statusCode ).to.be.equal( 200 );
        done();
      } );
      req.end(); // necessary when using http.request
    } );
  } );

  describe( 'get requests', function() {
    var bkpMethod;

    before( function() {
      bkpMethod = reqOptions.method;
      reqOptions.method = 'GET';
    } );

    after( function() {
      reqOptions.method = bkpMethod;
    } );

    describe( 'for favicon.ico', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = '/favicon.ico';
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a 200 response', function( done ) {
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );

      it( 'should only contain the string `ok` in the response body', function( done ) {
        req = http.request( reqOptions, function( res ) {
          res.setEncoding( 'utf8' ); // necessary to read data as plain text
          res.on( 'data', function( body ) {
            expect( body ).to.contain( 'ok' );
            done();
          } );
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'for status', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = '/status';
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a 200 response', function( done ) {
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );

      it( 'should contain the status string in the response body', function( done ) {
        req = http.request( reqOptions, function( res ) {
          res.setEncoding( 'utf8' ); // necessary to read data as plain text
          res.on( 'data', function( body ) {
            expect( body ).to.contain( 'ok:' );
            done();
          } );
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'with invalid url structure', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = '/onlykey';
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a 404', function( done ) {
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 404 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'with valid url structure', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = proxyPath( 'https://github.com/marcos-abreu/kamu/raw/master/test/assets/enrique_simonet-marina_veneciana-small.jpg' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      describe( 'but with invalid security check', function() {
        var bkpValidPath;

        before( function() {
          bkpValidPath = reqOptions.path;
          reqOptions.path = '/w' + reqOptions.path.slice( 2 );
        } );

        after( function() {
          reqOptions.path = bkpValidPath;
        } );

        it( 'should return a 404', function( done ) {
          req = http.request( reqOptions, function( res ) {
            expect( res.statusCode ).to.be.equal( 404 );
            done();
          } );
          req.end(); // necessary when using http.request
        } );
      } );

      describe( 'but with invalid external url encoding', function() {
        var bkpValidPath;

        before( function() {
          bkpValidPath = reqOptions.path;

          var parts = reqOptions.path.split( '/' );
          reqOptions.path = '/' + parts[ 1 ] + '/' + 'w' + parts[ 2 ].slice( 1 );
        } );

        after( function() {
          reqOptions.path = bkpValidPath;
        } );


        it( 'should return a 404', function( done ) {
          req = http.request( reqOptions, function( res ) {
            expect( res.statusCode ).to.be.equal( 404 );
            done();
          } );
          req.end(); // necessary when using http.request
        } );
      } );

      describe( 'and with valid security and valid url encoding', function() {
        describe( 'with a non-existent external url', function() {
          var bkpPath;

          before( function() {
            bkpPath = reqOptions.path;
            reqOptions.path = proxyPath( 'http://external-domain.com/path/to/some/image.png' );
          } );

          after( function() {
            reqOptions.path = bkpPath;
          } );

          it( 'should return a 404', function( done ) {
            this.timeout( 10000 );
            req = http.request( reqOptions, function( res ) {
              expect( res.statusCode ).to.be.equal( 404 );
              done();
            } );
            req.end(); // necessary when using http.request
          } );
        } );

        describe( 'with an existent external url', function() {


          describe( 'but the image exceeds the size limit', function() {
            var bkpPath;

            before( function() {
              bkpPath = reqOptions.path;
              reqOptions.path = proxyPath( 'https://github.com/marcos-abreu/kamu/raw/master/test/assets/enrique_simonet-marina_veneciana.jpg' );
            } );

            after( function() {
              reqOptions.path = bkpPath;
            } );

            it( 'should return a 404 response', function( done ) {
              this.timeout( 10000 );
              req = http.request( reqOptions, function( res ) {
                expect( res.statusCode ).to.be.equal( 404 );
                done();
              } );
              req.end(); // necessary when using http.request
            } );
          } );

          describe( 'with all image requirements met', function() {
            var bkpPath;

            before( function() {
              bkpPath = reqOptions.path;
              reqOptions.path = proxyPath( 'https://github.com/marcos-abreu/kamu/raw/master/test/assets/enrique_simonet-marina_veneciana-small.jpg' );
            } );

            after( function() {
              reqOptions.path = bkpPath;
            } );

            it( 'should return a 200 response', function( done ) {
              this.timeout( 10000 );
              req = http.request( reqOptions, function( res ) {
                expect( res.statusCode ).to.be.equal( 200 );
                done();
              } );
              req.end(); // necessary when using http.request
            } );

            it( 'should return the image data in the response body', function( done ) {
              this.timeout( 10000 );
              req = http.request( reqOptions, function( res ) {
                res.setEncoding( 'utf8' ); // necessary to read data as plain text
                res.on( 'data', function( body ) {
                  expect( body ).to.have.length.above( 1000 );
                  res.destroy(); // avoid triggering this event multiple times, and therefore calling the done callbakc multiple times
                  done();
                } );
              } );
              req.end(); // necessary when using http.request
            } );
          } );
        } );
      } );
    } );
  } );

  describe( 'use case', function() {
    describe( 'https redirect for image links', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = proxyPath( 'https://goo.gl/pTPDem' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a valid response', function( done ) {
        this.timeout( 10000 );
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'svg image with delimited content type', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        // info: using cdn.rawgit.com to properly serve svg with the right content type until github fixes this.
        reqOptions.path = proxyPath( 'https://cdn.rawgit.com/marcos-abreu/kamu/master/test/assets/enrique_simonet-marina_veneciana-small.svg' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a valid response', function( done ) {
        this.timeout( 10000 );
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'png image with delimited content type', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = proxyPath( 'https://raw.githubusercontent.com/marcos-abreu/kamu/master/test/assets/enrique_simonet-marina_veneciana-small.png' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a valid response', function( done ) {
        this.timeout( 10000 );
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'valid url with multiple subdomains', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = proxyPath( 'https://41.media.tumblr.com/5afe50a3809c1643dd7b98c871dd3795/tumblr_mz0s3p0N8U1qj6xkno1_500.jpg' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a valid response', function( done ) {
        this.timeout( 10000 );
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'valid url with invalid content type', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = proxyPath( 'https://github.com/marcos-abreu/kamu/blob/master/test/assets/enrique_simonet-marina_veneciana-small.png' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a not found response', function( done ) {
        this.timeout( 10000 );
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 404 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe( 'valid google chart url', function() {
      var bkpPath;

      before( function() {
        bkpPath = reqOptions.path;
        reqOptions.path = proxyPath( 'https://chart.googleapis.com/chart?cht=p3&chd=t:60,40&chs=250x100&chl=Hello|World' );
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      it( 'should return a valid response', function( done ) {
        this.timeout( 10000 );
        req = http.request( reqOptions, function( res ) {
          expect( res.statusCode ).to.be.equal( 200 );
          done();
        } );
        req.end(); // necessary when using http.request
      } );
    } );

    describe.skip( 'valid gravatar image', function() {
      it( 'should return a valid response', function() {

      } );
    } );

    describe.skip( 'url folloing allowed limit of redirects', function() {
      it( 'should return a valid response', function() {

      } );
    } );

    describe.skip( 'url exceeding allowed limit of redirects', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'follow redirects with strange url format', function() {
      it( 'should return a valid response', function() {

      } );
    } );

    describe.skip( 'valid url with path only location headers', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'infinite requests', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'urls without a protocol', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'host not found', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'non-valid content type', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'external request taking too long to respond', function() {
      it( 'should return a not found response', function() {

      } );
    } );

    describe.skip( 'temporary redirects for valid urls', function() {
      it( 'should return a valid response', function() {

      } );
    } );

    describe.skip( 'request from itself', function() {
      it( 'should return a not found response', function() {

      } );
    } );
  } );
} );
