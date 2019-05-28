const {
  getFilename
} = require('./utils')
const threadLoader = require('thread-loader');
threadLoader.warmup({
  // pool options, like passed to loader options
  // must match loader options to boot the correct pool
}, [
  'stylus-loader',
  'babel-loader',
  'vue-loader'
]);

exports.getPugLoaders = function () {
  return {
    test: /\.pug$/,
    loader: 'pug-plain-loader'
  }
}

exports.getJsLoaders = function (cacheDir = true) {
  return {
    test: /\.jsx?$/,
    use: ["thread-loader", {
      loader: 'babel-loader',
      options: {
        cacheDirectory: cacheDir,
        "presets": [
          [
            "@babel/preset-env",
            {
              "modules": false
            }
          ]
        ],
        "plugins": [
          "@babel/plugin-syntax-dynamic-import",
          "@babel/plugin-proposal-export-default-from"
        ]
      },
    }],
    exclude: /node_modules/
  }
}

exports.getImgLoaders = function (isdev, minimize, limit = 10240) {
  const loader = [{
    loader: 'url-loader',
    options: {
      limit,
      fallback: 'file-loader',
      name: getFilename(isdev, false, '[ext]')
    }
  }]

  if (!isdev) {
    loader.push('image-webpack-loader')
  }

  return {
    test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
    use: loader,
    exclude: /node_modules/,
  }
}

exports.getMediaLoaders = function (isdev) {
  return {
    test: /\.(mp3|mp4|amr)(\?.*)?$/,
    loader: 'file-loader',
    options: {
      name: getFilename(isdev, false, '[ext]')
    },
    exclude: /node_modules/,
  }
}

exports.getFontLoaders = function (isdev, limit = 10240) {
  return {
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
    loader: 'url-loader',
    options: {
      limit,
      fallback: 'file-loader',
      name: getFilename(isdev, false, '[ext]')
    },
    exclude: /node_modules/,
  }
}
