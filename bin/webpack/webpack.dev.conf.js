const merge = require('webpack-merge')
const baseConfs = require('./webpack.base.conf')
const plugins = require('./plugins')
const devPlugins = plugins.getDevHelperPlugins()

const devConfig = {
  devtool: 'heap-module-eval-source-map',
  watch: true,
  watchOptions: {
    ignored: [/node_modules/],
    aggregateTimeout: 800,
  }
}

module.exports = baseConfs.map((conf, i) => {
  if (typeof conf.plugins === 'undefined') {
    conf.plugins = devPlugins
  } else {
    conf.plugins = conf.plugins.concat(devPlugins)
  }

  return merge(conf, devConfig)
})[0]
