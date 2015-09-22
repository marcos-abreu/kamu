[![Build Status](https://travis-ci.org/marcos-abreu/kamu.svg?branch=master)](https://travis-ci.org/marcos-abreu/kamu)

## Kamu - (SSL) Asset Proxy

**Kamu** can help you secure your site by providing ways to serve external assets through a secure layer. When implementing SSL on your projects the one thing you cannot control are third party assets; if your project depends on those and you want to move forward with a full SSL implementation, than **Kamu** is for you.

The code was originally based on the code provided by [github camo project](https://github.com/atmos/camo).

**Kamu** was build to be easy to configure and extend, allowing you to adapt it to your own requirements. It also can be deployed into most of the hosting options available out there.

### Configuring Kamu
___

The most important configuration you will need to set are:
  - `KAMU_KEY`  - hexdec secure key
  - `KAMU_HOST` - fully qualified hostname

Bellow is a full list of environment variables you can set to configure the behavior of your **Kamu** proxy server.

| Environment Key           | Description |
| :------------------------ | :---------- |
| `KAMU_KEY`                 | this is the proxy key used to generate safe urls, making sure your server is only used to serve assets you allow it to. **must set to your own hexdec key** |
| `KAMU_HOST`                | fully qualified hostname of your server. **must set to the appropriate value** |
| `KAMU_PORT`                | host port. (default to: `8081`) |
| `KAMU_AGENT`               | agent string to be sent when requesting external assets as the `via` request header. (default to: `kamu.asset.proxy-{#app-version}`) |
| `KAMU_LENGTH`        | asset size limit in bytes. (defaults to: `5242880`) |
| `KAMU_REDIRECTS`       | maximum number of redirects to follow for an external asset request. (default to: `4`) |
| `KAMU_TIMEOUT`      | maximum waiting time for an external request in seconds. (default to: `10`) |
| `KAMU_KEEP_ALIVE`          | flag defining if the connection should be kept open to be reused by multiple requests, or if they should be closed after every request. (defaults to: `false`) |
| `KAMU_TIMINGS` | list of domains that are allowed to collect timings data, set to false to disable the feature - for more info [check here](). (default to: `false`) |
| `KAMU_LOGGING`             | set the logging permissions for the server. possible options are `debug`, `enabled` and `disabled`. (default to: `disabled`) |

Aside from the environment variables you can define, you can also limit the `content-type` of assets you want to allow, for that use the [mime-types.json](mime-types.json) file available.

### Deploying Kamu
___

In order to properly deploy your **kamu** proxy server follow these steps:

* **Step 1** - clone the latest **Kamu** tag into your host server, and install nodejs dependencies (`npm install`)
* **Step 2** - configure your HTTP Server to set the appropriate environment variables
* **Setp 3** - configure your server to start **Kamu** nodejs app and point your HTTP Server to it

### Serving Assets Through SSL
___

In order to serve your assets through a secure layer, the two most common options are:

1. Configure your HTTP Server with your own SSL certificate.
If you already have an SSL certificate and have your HTTP Server already setup to use it, then you just have to adjust your HTTP Server to point to the **Kamu** nodejs app.

2. Only allow access to your **Kamu** proxy server through a CDN that provides you with the SSL layer.
If the process of managing your own SSL certificates, as well as configuring your HTTP Servers to use it sounds complicated, expensive, or just too much for your project; than using a CDN as a gateway to your **Kamu** proxy server is probably your best option. Most CDN servers provides SSL by default, and you can even find free options available (check [CloudFlare](https://www.cloudflare.com)).


Even if you go for *option #1* you should always consider using a CDN as a gateway to your **Kamu** proxy server in order to provide assets as fast as possible with low impact to the number of requests your server can handle. CDN's are always great options when serving assets.

### Generating Kamu Asset URL
___

Once you have configured your **kamu** proxy server, you will also need to generate HTML pages with links that makes use of your this server.

The logic used to generate the proxy urls can be found in the [demo/utils.js](demo/utils.js) file - the code is well commented so that you can adapt it to your own use.

If you want to locally test your newly configured **kamu** proxy server, you can use a pre-configured gulp task to generate valid urls for your server.

```
gulp proxy --url=http://www.some-domain.com/path/to/image.png [--key=SOME-HEXDEC-KEY] [--host=https://myhost.com]
```

| Command Option           | Description |
| :----------------------- | :---------- |
| `--url`                  | external media url you want to proxy through your **Kamu** server |
| `--key`                  | `KAMU_KEY` value set as an enviroument variable in your server |
| `--host`                 | `KAMU_HOST` value set as an envirounment variable in your server |

the `--key` and `--host` are optinal parameters, and if not informed it will use the defaults provided in the [proxy/config.js](proxy/config.js) file. If your server set those enviroument variables (and they should) you must provide these options in order to generate valid urls.

### Processing Image
___

Kamu allows you to post process the image before sending it back to the original request. To do that you can either inform the operations through the url path or through querystring parameters:

- when using the url path, inform it as the last part of the path, and with values separated from keys by an underscore sign, and properties separated from each other by commas. e.g:
`http://localhost:8081/f6b7795101/687474703a2f2f616e696d616c69612d6c/x_crop,t_0,l_0,w_300,h_100`

on the previous example the first part of the url path is the public key, the second part is the encoded url, and the third part defines the properties to be applied to the image before returing it.

- when using querystring parameters to inform the operations to be applied on the image, just follow the conventions for keys and values of querystring parameters. e.g:
`http://localhost:8081/f6b7795101/687474703a2f2f616e696d616c69612d6c?x=crop&t=0&l=0&w=300&h=100`

Both examples above will generate the same output.

Always keep in mind that any operation applied to the original image takes time to perform, and even though **Kamu** uses really fast libraries for that, you should consider the performance impact of image requests. You should also consider using a CDN, and by doing so the performance impact will just be on the first request.

#### Requirements

If you plan to perform post processing operations on your images you will need to install [libvips](https://github.com/jcupitt/libvips) on your **Kamu** proxy server. Follow the instructions of the **Prerequisites** instructions onf this link: [http://sharp.dimens.io/en/stable/install/#prerequisites](http://sharp.dimens.io/en/stable/install/#prerequisites)

#### Usage

In order to manipulate the image you will need to inform the operation (or operations) you want to perform and inform all the properties required. Bellow you will find information about each operation and the required properties.

##### Size Operations

- **scale** (`s=scale` **|** `s_scale`) - (default operation) scale image exactly to the given width (`w`) and height (`h`) while NOT retaining proportions. When only one value of either width (`w`) or height (`h`) is provided, the image will resize to the provided size property while keeping a proportial ratio with the uninformed one.

   e.g: `/key/url?s=scale&w=200&h=100` **|** `/key/url/s_scale,w_200,h_100`

- **fit** (`s=fit` **|** `s_fit`) - scale image to fit in the given width (`w`) and height (`h`) while retaining original proportions. If only one value of either width (`w`) or height (`h`) is provided, the operation will fallback to `scale`.

   e.g: `/key/url?s=fit&w=200&h=100` **|** `/key/url/s_fit,w_200,h_100`

- **fill** (`s=fill` **|** `s_fill`) - preserving aspect ratio, resize image to be as small as possible while ensuring its dimentions are greater than or equal to the width and height specified. If only one value of either width (`w`) or height (`h`) is provided, the operation will fallback to `scale`.

   e.g: `/key/url?s=fill&w=200&h=100` **|** `/key/url/s_fill,w_200,h_100`

##### Extract Operations

- **crop** (`s=crop` **|** `s_crop`) - extracts portion of the image defined by width (`xw`) and height (`xh`), with an optional offset: top (`xt`) and left (`xl`). If only one value of either width (`xw`) or height (`xh`) is provided, no operation will be performed.

   e.g:

   `/key/url?x=crop&xw=200&xh=100` **|** `/key/url/x_crop,xw_200,xh_100`

   e.g: extracting with offset

   `/key/url?x=crop&xw=200&xh=100&xt=50&xl=10` **|** `/key/url/x_crop,xw_200,xh_100,xt_50,xl_10`

p.s: note that extract properties for width, height, top and left are prefixed with an `x`

##### Rotate Operations

- **rotate** (`r=90` **|** `r_90`) - rotates the image clockwise by predefined angles of: 0, 90, 180, 270 degrees. If you inform any other angle, the operation won't be performed. 

   e.g: `/key/url?r=180` **|** `/key/url/r_180`

##### Mirroring Operations

- **flip** (`m=flip` **|** `m_flip`) - flip the image vertically

   e.g: `/key/url?m=flip` **|** `/key/url/m_flip`

- **flop** (`m=flop` **|** `m_flop`) -  flop the image horizontally

   e.g: `/key/url?m=flop` **|** `/key/url/m_flop`


#### Combined Operations

You can combine operations that don't bellong to the same group in order to active a more complex result, such as: rotate and crop; or scale and flip; or rotate, crop, and flop. Keep in mind that when applying combined operations the order which you inform the operations might impact the final result.

   e.g: rotate and crop

   `/key/url?r=180&x=crop&w=200&h=100` **|** `/key/url/r_180,x_crop,w_200,h_100`

   e.g: scale and flip

   `/key/url?s=scale&w=200&h=100&m=flip` **|** `/key/url/s_scale,w_200,h_100,m_flip`

   e.g: rotate, crop and flip

   `/key/url?r=90&x=crop&w=200&h=100&m=flip` **|** `/key/url/r_90,x_crop,w_200,h_100,m_flip`

#### Output

In adition to the operations you can perform on the image, you can also control the output quality and encoding format for the result image.

- **quality** (`q=80` **|** `q_80`) - Defineds the output quality for the image. the value can range from 1 to 100.

   e.g: `/key/url?r=180&q=60` **|** e.g: `/key/url/r_180,q_60`

- **format** (`f=png` **|** `f_png`) - Defines the output format for the image, valid values are: `jpeg`, `png`, `webp` and `raw`. Anything else or no format will default to the input format.

   e.g: `/key/url?s=fit&w=200&h=100&f=png` **|** `/key/url/s_fit,w_200,h_100,f_png`


### Contributing to Kamu
___

If you find yourself improving the code and you think others would benefit from your changes, or if you find a bug in **kamu** open a pull request.

But before opening a pull request make sure you create/modify the unit tests to make sure your changes haven't broken the current behavior.

The unit tests uses *[mocha](https://github.com/mochajs/mocha)*, *[sinon](http://sinonjs.org/)*, *[chai](https://github.com/domenic/sinon-chai)*, and *[rewire](https://github.com/jhnns/rewire)* - these are common modules used when writing nodejs unit tests.

To run the current set of specs:

`npm test`
