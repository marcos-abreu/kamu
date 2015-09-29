'use strict';

var path = require( 'path' ),
    meta = require( path.resolve( __dirname, '../', 'package.json' ) );

// application name
exports.name            = meta.name;
// application version
exports.version         = meta.version;

// private key used to generate and validate media asset signatures
exports.proxyKey        = process.env.KAMU_KEY || '0xF6D61696E2E636F6D2F736';


// can be set to: 'disabled' (no logs), 'debug' (all logs), 'dev' (warns and errors), 'prod' (only errors)
exports.log             = process.env.KAMU_LOGGING || 'disabled';

// serer host
exports.host            = process.env.KAMU_HOST || 'https://www.media-proxy.com';

// server port
exports.port            = parseInt( process.env.KAMU_PORT || 8081, 10 );
// this agent will be sent with the external request ad the 'via' request header
exports.proxyAgent      = process.env.KAMU_AGENT || ( 'kamu.asset.proxy-' + meta.version );


// maximum number of redirects to follow for a media asset request
exports.maxRedirects    = parseInt( ( process.env.KAMU_REDIRECTS || 4 ), 10 );
// maximum waiting time for a media asset response (in seconds)
exports.socketTimeout   = parseInt( ( process.env.KAMU_TIMEOUT || 10 ), 10 );
// true - will keep the connection open | false will close the connection for every request
exports.keepAlive       = !!process.env.KAMU_KEEP_ALIVE; // false by default


// list of domains that are allowed to get timings requests - cross-domain timings
// set to false to block timings from all external domains
exports.timingOrigin    = process.env.KAMU_TIMINGS || false; // it will be assigned as 'false' string as expected
// media asset length limit in bytes - defaults to 5Mb
exports.lengthLimit     = parseInt( ( process.env.KAMU_LENGTH || 5242880 ), 10 );
// valid content types
exports.validTypes      = require( path.resolve( __dirname, '../', 'mime-types.json' ) );


// valid transformation media content types
exports.transformTypes = [
  "image/jp2",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/tiff"
];
// do not enlarge the image if its dimentions are less than what is required
exports.transformWithoutEnlargement = true;
// output format supported
exports.transformFormats = [ 'jpeg', 'png', 'webp', 'raw' ];
// pre-defined rotation angles
exports.transformAngles  = [ '0', '90', '180', '270' ];
exports.transformGravity = [ 'north', 'east', 'south', 'west', 'center', 'centre' ];
// s    scale   |   x     extract   |  r    rotate   |  m     mirroring   |  q    quality   |  f    format
// w    width   |   h     height    |  g    gravity
// xw   crop w  |   xh    crop h    |  xt   crop top |  xl    crop left
exports.transformOptions = [ 's', 'x', 'r', 'm', 'q', 'f', 'w', 'h', 'xw', 'xh', 'xt', 'xl', 'g' ];

// by default it will redirec the request to the original url without the transformation parameters
// in case the transformation fails
exports.transformRedirectOnError = process.env.KAMU_TRANS_REDIRECT_ONERROR &&
                                   process.env.KAMU_TRANS_REDIRECT_ONERROR.toLowercase() === 'false' ? false : true;

// default safe headers to be used by default on responses
exports.defaultHeaders  = {
  // do not allow part images to be shown on frames (iframes)
  "X-Frame-Options": "deny",
  // enables cross-site scripting filter (built into most recent web browsers)
  "X-XSS-Protection": "1; mode=block",
  // "nosniff" - prevents IE and Chrome from MIME-sniffing a response away from the declared content-type
  "X-Content-Type-Options": "nosniff",
  // protect against cross-site scripting/injection by only allowing image data, and
  // only unsafe css inline - allowing images to be included in inline css
  "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'",
  // HSTS Policy | allowing client to cache https responses including sub domains for 365 days
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
};
