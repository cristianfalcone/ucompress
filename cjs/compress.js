'use strict';
const {createReadStream, createWriteStream, stat} = require('fs');
const {pipeline} = require('stream');
const zlib = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('zlib'));

const headers = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('./headers.js'));

const {
  BROTLI_MAX_QUALITY,
  BROTLI_MODE_GENERIC,
  BROTLI_MODE_FONT,
  BROTLI_MODE_TEXT,
  BROTLI_PARAM_MODE,
  BROTLI_PARAM_QUALITY,
  BROTLI_PARAM_SIZE_HINT,
  Z_BEST_COMPRESSION
} = zlib.constants;

const {
  createBrotliCompress,
  createDeflate,
  createGzip
} = zlib;

const zlibDefaultOptions = {
  level: Z_BEST_COMPRESSION
};

const br = (source, options, mode) => new Promise((res, rej) => {
  const dest = source + '.br';
  stat(source, (err, stats) => {
    /* istanbul ignore next */
    if (err) rej(err);
    else pipeline(
      createReadStream(source),
      createBrotliCompress({
        [BROTLI_PARAM_SIZE_HINT]: stats.size,
        [BROTLI_PARAM_QUALITY]: BROTLI_MAX_QUALITY,
        [BROTLI_PARAM_MODE]: mode == 'text' ?
          BROTLI_MODE_TEXT : (
            mode === 'font' ?
              BROTLI_MODE_FONT :
              /* istanbul ignore next */
              BROTLI_MODE_GENERIC
          )
      }),
      createWriteStream(dest),
      err => {
        /* istanbul ignore next */
        if (err)
          rej(err);
        else {
          headers(source, dest, {
            ...options.headers,
            'Content-Encoding': 'br'
          }).then(res, rej);
        }
      }
    );
  });
});

const deflate = (source, options) => new Promise((res, rej) => {
  const dest = source + '.deflate';
  pipeline(
    createReadStream(source),
    createDeflate(zlibDefaultOptions),
    createWriteStream(dest),
    err => {
      /* istanbul ignore next */
      if (err)
        rej(err);
      else {
        headers(source, dest, {
          ...options.headers,
          'Content-Encoding': 'deflate'
        }).then(res, rej);
      }
    }
  );
});

const gzip = (source, options) => new Promise((res, rej) => {
  const dest = source + '.gzip';
  pipeline(
    createReadStream(source),
    createGzip(zlibDefaultOptions),
    createWriteStream(dest),
    err => {
      /* istanbul ignore next */
      if (err)
        rej(err);
      else {
        headers(source, dest, {
          ...options.headers,
          'Content-Encoding': 'gzip'
        }).then(res, rej);
      }
    }
  );
});

module.exports = (source, mode, options) => Promise.all([
    headers(source, source, options.headers),
    br(source, options, mode),
    deflate(source, options),
    gzip(source, options)
]);
