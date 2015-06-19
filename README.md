[![Build Status](https://travis-ci.org/marcos-abreu/kamu.svg?branch=master)](https://travis-ci.org/marcos-abreu/kamu)

## Kamu - (SSL) Asset Proxy

**Kamu** can help you secure your site by providing ways to serve external assets through a secure layer. When implementing SSL on your projects the one thing you cannot control are third party assets; if your project depends on those and you want to move forward with a full SSL implementation, than **Kamu** is for you.

The code was originally based on the code provided by [github camo project](https://github.com/atmos/camo).

**Kamu** was build to be easy to configure and extend, allowing you to adapt it to your own requirements. It also can be deployed into most of the hosting options available out there.

### Configuring Kamu

The most important configuration you will need to set are:
  - `KAMU_KEY`  - hexdec secure key
  - `KAMU_HOST` - fully qualified hostname

Bellow is a full list of environment variables you can set to configure the behavior of your **Kamu** proxy server.

| Environment Key           | Description |
| :------------------------ | :---------- |
| `KAMU_KEY`                 | this is the proxy key used to generate safe urls, making sure your server is only used to serve assets you allow it to. **must set to your own hexdec key** |
| `KAMU_HOST`                | fully qualified hostname of your server. **must set to the appropriate value** |
| `KAMU_PORT`                | host port. (default to: 8081) |
| `KAMU_AGENT`               | agent string to be sent when requesting external assets as the `via` request header. (default to: kamu.asset.proxy-{#app-version}) |
| `KAMU_LENGTH_LIMIT`        | asset size limit in bytes. (defaults to: 5242880) |
| `KAMU_MAX_REDIRECTS`       | maximum number of redirects to follow for an external asset request. (default to: 4) |
| `KAMU_SOCKET_TIMEOUT`      | maximum waiting time for an external request in seconds. (default to: 10) |
| `KAMU_KEEP_ALIVE`          | flag defining if the connection should be kept open to be reused by multiple requests, or if they should be closed after every request. (defaults to: false) |
| `KAMU_TIMING_ALLOW_ORIGIN` | list of domains that are allowed to collect timings data, set to false to disable the feature - for more info [check here](). (default to: false) |
| `KAMU_LOGGING`             | set the logging permissions for the server. possible options are `debug`, `enabled` and `disabled`. (default to: disabled) |

Aside from the environment variables you can define, you can also limit the `content-type` of assets you want to allow, for that use the [mime-types.json](mime-types.json) file available.

### Deploying Kamu

In order to properly deploy your **kamu** proxy server follow these steps:

* **step 1** - clone the latest **Kamu** tag into your host server, and install nodejs dependencies (`npm install`)
* **step 2** - configure your HTTP Server to set the appropriate environment variables
* **setp 3** - configure your server to start **Kamu** nodejs app and point your HTTP Server to it

### Serving Assets Through SSL

In order to serve your assets through a secure layer, the two most common options are:

1. Configure your HTTP Server with your own SSL certificates.
If you already have a SSL certificate and have your HTTP Server already setup to use it, then you just have to adjust your HTTP Server to point to the **Kamu** nodejs app.

2. Only allow access to your **Kamu** proxy server through a CDN that provides you with the SSL layer.
If the process of managing your own SSL certificates, as well as configuring your HTTP Servers to use it sounds complicated, expensive, or just too much for your project; than using a CDN as a gateway to your **Kamu** proxy server is probably your best option. Most CDN servers provides SSL by default, and you can even find free options available (check [CloudFlare](https://www.cloudflare.com)).


Even if you go for *option #1* you should always consider using a CDN as a gateway to your **Kamu** proxy server in order to provide assets as fast as possible with low impact to the number of requests your server can handle. CDN's are always great options when serving assets.

### Generating Kamu Asset URL

Once you have configured your **Kamu** proxy server, you will need to also generate pages with links that makes use of your newly configured **Kamu** proxy server.

The logic used to generate the proxy urls can be seen found in the [demo/generate-url.js](demo/generate-url.js) file - the code is well commented so that you can adapt to your own use.

If you only want to test your newly configured **kamu** proxy server, then you can use a pre-configured gulp task to generate your urls:

```
gulp proxy --url=http://www.google.com/images/srpr/logo11w.png
```

where `http://www.google.com/images/srpr/logo11w.png` should be replaced with a valid external asset url.

### Contributing to Kamu

If you find yourself improving the code and you think others would benefit from your changes, or if you find a bug in **kamu** open a pull request.

But before opening a pull request make sure you create/modify the unit tests to make sure your changes haven't broken the current behavior.

The unit tests uses *[mocha]()*, *[sinon]()*, *[chai]()*, and [rewire]()* - these are common modules used when writing javascript (nodejs) unit tests.

To run the current set of specs:

`npm test`
