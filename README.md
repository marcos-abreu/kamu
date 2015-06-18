[![Build Status](https://travis-ci.org/marcos-abreu/kamu.svg?branch=master)](https://travis-ci.org/marcos-abreu/kamu)

# Kamu - Asset Proxy

Kamu is a media asset proxy, that can be used as an *SSL* image proxy, or ad script proxy, or any type of asset proxy your project might need;

the code was originally based on the code provided by github camo project (https://github.com/atmos/camo)

Kamu was build to be easy to configure and extend, and also to work out of the box with most hosting options available.

## Configuring kamu

The most important configuration you will need to change are: `proxyKey` and `domain`, these and many other configurations can be set by providing environment options.

- to set the `proxyKey` you can set the environment variable `KAMU_KEY`
- to set the `domain` you can set the environment variable `KAMU_DOMAIN`

For a complete list of all properties you can modify for your project check the `proxy/config.js` file.

## Running the unit tests

`npm test`


## Kamu as an image proxy

### step 1 - make sure your host is configured with nodejs, and a HTTP Server

### step 2 - deploy the latest tag into the appropriate folder configured by your HTTP Server

### step 3 - start the nodejs application `npm start`

To test if your server is properly configured, ssh into your server and use the gulp:
  e.g: gulp proxy --url=http://www.google.com/images/srpr/logo11w.png

p.s: change the `http://www.some-domain.com/path/to/image.png` with a valid image url
