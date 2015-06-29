'use strict';

require( '../common' );

var http   = require( 'http' );
var server;

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
        reqOptions.path = '/e6cff3f0bcaae2a43c4567b0153994de575c8268/687474703a2f2f65787465726e616c2d646f6d61696e2e636f6d2f706174682f746f2f736f6d652f696d6167652e706e67';
      } );

      after( function() {
        reqOptions.path = bkpPath;
      } );

      describe( 'but with invalid security check', function() {
        var bkpValidPath;

        before( function() {
          bkpValidPath = reqOptions.path;
          reqOptions.path.replace( 'e6cff3f0bcaae', 'aaaaaaaaaaaaa' );
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
          reqOptions.path.replace( '687474703a2f2', 'aaaaaaaaaaaaa' );
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
            // for url: http://external-domain.com/path/to/some/image.png
            reqOptions.path = '/e6cff3f0bcaae2a43c4567b0153994de575c8268/687474703a2f2f65787465726e616c2d646f6d61696e2e636f6d2f706174682f746f2f736f6d652f696d6167652e706e67';
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

        describe( 'with an existent external url', function() {

          describe( 'but the image exceeds the size limit', function() {
            it( 'should return a 404 response', function() {

            } );
          } );

          describe( 'with all image requirements met', function() {
            var bkpPath;

            before( function() {
              bkpPath = reqOptions.path;
              // for url: http://www.google.com/images/errors/logo_sm_2_hr.png
              reqOptions.path = '/a8a9ed29d32342ead2dd09a2d2384347632a61d0/687474703a2f2f7777772e676f6f676c652e636f6d2f696d616765732f6572726f72732f6c6f676f5f736d5f325f68722e706e67';
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

            it( 'should return the image data in the response body', function( done ) {
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

} );

//   def test_always_sets_security_headers
//     ['/', '/status'].each do |path|
//       response = RestClient.get("#{config['host']}#{path}")
//       assert_equal "deny", response.headers[:x_frame_options]
//       assert_equal "default-src 'none'; img-src data:; style-src 'unsafe-inline'", response.headers[:content_security_policy]
//       assert_equal "nosniff", response.headers[:x_content_type_options]
//       assert_equal "max-age=31536000; includeSubDomains", response.headers[:strict_transport_security]
//     end

//     response = request('http://dl.dropbox.com/u/602885/github/soldier-squirrel.jpg')
//     assert_equal "deny", response.headers[:x_frame_options]
//     assert_equal "default-src 'none'; img-src data:; style-src 'unsafe-inline'", response.headers[:content_security_policy]
//     assert_equal "nosniff", response.headers[:x_content_type_options]
//     assert_equal "max-age=31536000; includeSubDomains", response.headers[:strict_transport_security]
//   end

//   def test_proxy_valid_image_url
//     response = request('http://media.ebaumsworld.com/picture/Mincemeat/Pimp.jpg')
//     assert_equal(200, response.code)
//   end

//   def test_svg_image_with_delimited_content_type_url
//     response = request('https://saucelabs.com/browser-matrix/bootstrap.svg')
//     assert_equal(200, response.code)
//   end

//   def test_png_image_with_delimited_content_type_url
//     response = request('http://uploadir.com/u/cm5el1v7')
//     assert_equal(200, response.code)
//   end

//   def test_proxy_valid_image_url_with_crazy_subdomain
//     response = request('http://27.media.tumblr.com/tumblr_lkp6rdDfRi1qce6mto1_500.jpg')
//     assert_equal(200, response.code)
//   end

//   def test_strict_image_content_type_checking
//     assert_raise RestClient::ResourceNotFound do
//       request("http://calm-shore-1799.herokuapp.com/foo.png")
//     end
//   end

//   def test_proxy_valid_google_chart_url
//     response = request('http://chart.apis.google.com/chart?chs=920x200&chxl=0:%7C2010-08-13%7C2010-09-12%7C2010-10-12%7C2010-11-11%7C1:%7C0%7C0%7C0%7C0%7C0%7C0&chm=B,EBF5FB,0,0,0&chco=008Cd6&chls=3,1,0&chg=8.3,20,1,4&chd=s:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA&chxt=x,y&cht=lc')
//     assert_equal(200, response.code)
//   end

//   def test_proxy_valid_chunked_image_file
//     response = request('http://www.igvita.com/posts/12/spdyproxy-diagram.png')
//     assert_equal(200, response.code)
//     assert_nil(response.headers[:content_length])
//   end

//   def test_proxy_https_octocat
//     response = request('https://octodex.github.com/images/original.png')
//     assert_equal(200, response.code)
//   end

//   def test_proxy_https_gravatar
//     response = request('https://1.gravatar.com/avatar/a86224d72ce21cd9f5bee6784d4b06c7')
//     assert_equal(200, response.code)
//   end

//   def test_follows_redirects
//     response = request('http://cl.ly/1K0X2Y2F1P0o3z140p0d/boom-headshot.gif')
//     assert_equal(200, response.code)
//   end

//   def test_follows_redirects_formatted_strangely
//     response = request('http://cl.ly/DPcp/Screen%20Shot%202012-01-17%20at%203.42.32%20PM.png')
//     assert_equal(200, response.code)
//   end

//   def test_follows_redirects_with_path_only_location_headers
//     assert_nothing_raised do
//       request('http://blogs.msdn.com/photos/noahric/images/9948044/425x286.aspx')
//     end
//   end

//   def test_forwards_404_with_image
//     spawn_server(:not_found) do |host|
//       uri = request_uri("http://#{host}/octocat.jpg")
//       response = RestClient.get(uri){ |response, request, result| response }
//       assert_equal(404, response.code)
//       assert_equal("image/jpeg", response.headers[:content_type])
//     end
//   end

//   def test_404s_on_request_error
//     spawn_server(:crash_request) do |host|
//       assert_raise RestClient::ResourceNotFound do
//         request("http://#{host}/cats.png")
//       end
//     end
//   end

//   def test_404s_on_infinidirect
//     assert_raise RestClient::ResourceNotFound do
//       request('http://modeselektor.herokuapp.com/')
//     end
//   end

//   def test_404s_on_urls_without_an_http_host
//     assert_raise RestClient::ResourceNotFound do
//       request('/picture/Mincemeat/Pimp.jpg')
//     end
//   end

//   def test_404s_on_images_greater_than_5_megabytes
//     assert_raise RestClient::ResourceNotFound do
//       request('http://apod.nasa.gov/apod/image/0505/larryslookout_spirit_big.jpg')
//     end
//   end

//   def test_404s_on_host_not_found
//     assert_raise RestClient::ResourceNotFound do
//       request('http://flabergasted.cx')
//     end
//   end

//   def test_404s_on_non_image_content_type
//     assert_raise RestClient::ResourceNotFound do
//       request('https://github.com/atmos/cinderella/raw/master/bootstrap.sh')
//     end
//   end

//   def test_404s_on_connect_timeout
//     assert_raise RestClient::ResourceNotFound do
//       request('http://10.0.0.1/foo.cgi')
//     end
//   end

//   def test_404s_on_environmental_excludes
//     assert_raise RestClient::ResourceNotFound do
//       request('http://iphone.internal.example.org/foo.cgi')
//     end
//   end

//   def test_follows_temporary_redirects
//     response = request('http://bit.ly/1l9Fztb')
//     assert_equal(200, response.code)
//   end

//   def test_request_from_self
//     assert_raise RestClient::ResourceNotFound do
//       uri = request_uri("http://camo-localhost-test.herokuapp.com")
//       response = request( uri )
//     end
//   end

//   def test_404s_send_cache_headers
//     uri = request_uri("http://example.org/")
//     response = RestClient.get(uri){ |response, request, result| response }
//     assert_equal(404, response.code)
//     assert_equal("0", response.headers[:expires])
//     assert_equal("no-cache, no-store, private, must-revalidate", response.headers[:cache_control])
//   end
// end

// class CamoProxyQueryStringTest < Test::Unit::TestCase
//   include CamoProxyTests

//   def request_uri(image_url)
//     hexdigest = OpenSSL::HMAC.hexdigest(
//       OpenSSL::Digest.new('sha1'), config['key'], image_url)

//     uri = Addressable::URI.parse("#{config['host']}/#{hexdigest}")
//     uri.query_values = { 'url' => image_url, 'repo' => '', 'path' => '' }

//     uri.to_s
//   end

//   def request(image_url)
//     RestClient.get(request_uri(image_url))
//   end
// end

// class CamoProxyPathTest < Test::Unit::TestCase
//   include CamoProxyTests

//   def hexenc(image_url)
//     image_url.to_enum(:each_byte).map { |byte| "%02x" % byte }.join
//   end

//   def request_uri(image_url)
//     hexdigest = OpenSSL::HMAC.hexdigest(
//       OpenSSL::Digest.new('sha1'), config['key'], image_url)
//     encoded_image_url = hexenc(image_url)
//     "#{config['host']}/#{hexdigest}/#{encoded_image_url}"
//   end

//   def request(image_url)
//     RestClient.get(request_uri(image_url))
//   end
// end