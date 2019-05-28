const { getFilename } = require('./utils')

exports.getTsLoaderWithPlugins = function () {
  const { CheckerPlugin } = require('awesome-typescript-loader')

  return {
    loaders: {
      test: /\.tsx?$/,
      use: [{
        loader: 'awesome-typescript-loader'
      }]
    },
    plugins: [new CheckerPlugin()]
  }
}

exports.getVueLoaderWithPlugins = function () {
  const VueLoaderPlugin = require('vue-loader/lib/plugin')
  return {
    loaders: {
      test: /\.vue$/,
      use: ["thread-loader", {
        loader: 'vue-loader',
      }],
      exclude: /node_modules/,
    },
    plugins: [new VueLoaderPlugin()]
  }
}

const getBaseLoader = function (isdev) {
  return isdev ? ['css-loader', 'stylus-loader'] : ['css-loader', 'postcss-loader', 'stylus-loader']
}
exports.getStylLoaderMaybeWithPlugins = function (isdev, withPlugin) {
  const test = /\.styl(us)?$/
  const MiniCssExtractPlugin = require("mini-css-extract-plugin");
  const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

  if (withPlugin) {
    return {
      loaders: {
        test,
        use: ["thread-loader", {
          loader: MiniCssExtractPlugin.loader
        }].concat(getBaseLoader(isdev))
      },
      plugins: [ new MiniCssExtractPlugin({
        filename: getFilename(isdev, true, 'css'),
        chunkFilename: isdev ? '[id].js' : '[id]-[chunkhash].js',
      }), new OptimizeCssAssetsPlugin() ]
    }
  } else {
    return {
      loaders: {
        test,
        use: ["thread-loader", 'style-loader'].concat(getBaseLoader(isdev))
      },
      plugins: []
    }
  }
}
