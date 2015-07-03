/*
 * The following generates a proxy url, based on the current server configuration
 * and the provided url parameter
 */
var Crypto = require('crypto');
var config = require( '../proxy/config' );

/*
 * returns a proxy url string based on server configuration
 *
 * @param 		string 		url 	url object for external url
 * @returns 	string 				proxy url string
 */
exports.proxyUrl = function(url) {
  var hmac,
      hmacDigest,
      urlDigest;

  hmac = Crypto.createHmac('sha1', config.proxyKey);
  hmac.update(url, 'utf8');

  hmacDigest = hmac.digest('hex');

  urlDigest = new Buffer(url).toString('hex');
  return config.host + '/' + hmacDigest + '/' + urlDigest;
};
