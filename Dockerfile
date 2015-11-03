FROM ubuntu:14.04

RUN apt-get update -y
RUN apt-get install -y \
  pkg-config \
  automake \
  build-essential \
  curl \
  gobject-introspection \
  gtk-doc-tools \
  fontconfig \
  gettext \
  swig \
  libglib2.0-dev \
  libjpeg-turbo8-dev \
  libpng12-dev \
  libwebp-dev \
  libtiff5-dev \
  libexif-dev \
  libxml2-dev \
  libfftw3-dev \
  libmagickwand-dev \
  libmagickcore-dev \
  libgsf-1-dev \
  liblcms2-dev \
  liborc-0.4-dev \
  liblcms2-2 \
  liblcms-utils \
  libpango1.0-dev\
  git \
  nodejs \
  npm 

# Fix link to node executable
RUN sudo ln -s /usr/bin/nodejs /usr/bin/node

# Build libvips
WORKDIR /tmp
RUN git clone http://github.com/jcupitt/libvips.git && \
  cd libvips && \
  git reset --hard 3207cca96c6aed6927d87e55ef03ce7411a1fe71 && \
  ./bootstrap.sh && \
  ./configure --enable-debug=no \
#    --disable-static \
    --disable-docs \
    --enable-cxx=yes \
    --with-cfitsio \
    --with-graphicsmagick \
    --with-magickpackage=GraphicsMagick \
    --with-openslide \
    --with-webp \
    --without-python \
    --without-gsf && \
  make && \
  make install

RUN ldconfig

ENV CPATH /usr/local/include
ENV LIBRARY_PATH /usr/local/lib

# add the code to the image and install deps
RUN mkdir -p /mnt/log /var/kamu/releases && ln -sf /var/kamu/releases/current /var/kamu/current
ADD . /var/kamu/releases/current

# Install sharp manually from master
RUN rm -rf /var/kamu/releases/current/node_modules/sharp
RUN git clone https://github.com/lovell/sharp.git /var/kamu/releases/current/node_modules/sharp && \
  cd /var/kamu/releases/current/node_modules/sharp && \
  git reset --hard 82e215a42e7c68a056a2388eceb1dbd40743e896

# finish install of nodejs deps
RUN cd /var/kamu/releases/current/node_modules/sharp; npm install --unsafe-perm
RUN cd /var/kamu/releases/current; npm install 
RUN npm install -g pm2

# link nodejs to node so pm2 can find it
RUN ln -s /usr/bin/nodejs /usr/local/bin/node

# Expose the Kamu port
EXPOSE 8081

# Run Kamu
CMD ["pm2", "start", "/var/kamu/releases/current/index.js", "-i", "0", "--no-daemon", "--no-color"]

