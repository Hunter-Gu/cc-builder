const { env, isdev, paths: { src }, [env]: { env: { NODE_ENV } } } = require('./config')

module.exports = {
  target: 'web',
  context: src,
  mode: NODE_ENV,
  performance: {
    hints: false, // 'warning',
    maxEntrypointSize: 25000,
    maxAssetSize: 25000
  },
  optimization: {
    minimize: !isdev,
    // minimizer: [],
    namedModules: !isdev,
    namedChunks: !isdev,
    // runtimeChunk: 'single',
    noEmitOnErrors: !isdev,
    nodeEnv: NODE_ENV,
    // splitChunks: {
    //   chunks: 'all',
    //   cacheGroups: splitChunks
    // }
  },
}
