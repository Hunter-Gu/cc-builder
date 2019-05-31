const config = require('./config')
const { isdev, paths: { src, cache }, env, [env]: { assetsRoot, publicPath } } = config
const base = require('./base')
const loaders = require('./loaders')
const plugins = require('./plugins')
const loaderWithPlugins = require('./loader-with-plugins')
const { getFilesByExt, getFilename, curRoot } = require('./utils')

const configs = []

const pugLoader = loaders.getPugLoaders()
const jsLoader = loaders.getJsLoaders(cache)
const imgLoader = loaders.getImgLoaders(isdev)
const fontLoader = loaders.getFontLoaders(isdev)
const mediaLoader = loaders.getMediaLoaders(isdev)

const definePlugin = plugins.getDefinePlugin()
const cleanPlugin = plugins.getCleanPlugin(assetsRoot)
const copyPlugin = plugins.getCopyPlugin()

const tsLoaderWithPlugins = loaderWithPlugins.getTsLoaderWithPlugins()
const vueLoaderWithPlugins = loaderWithPlugins.getVueLoaderWithPlugins()
const stylLoaderMaybeWithPlugins = loaderWithPlugins.getStylLoaderMaybeWithPlugins(isdev, false)

// javascript
configs.push(Object.assign({}, base, {
  entry: Object.assign({}, getFilesByExt('.js', { path: src, skips: ['_', /\./] }), getFilesByExt('.ts', { path: src, skips: ['_', /\./] })),
  output: {
    path: assetsRoot,
    filename: getFilename(true, true, 'js'),
    chunkFilename: isdev ? '[id].js' : '[id]-[chunkhash].js',
    publicPath,
    libraryTarget: 'umd'
  },
  resolve: {
    alias: config.alias,
    modules: ['node_modules'],
    mainFields: ['main', 'module', 'browser'],
    extensions: ['.js', '.json', '.ts']
  },
  resolveLoader: {
    modules: [curRoot('node_modules')],
  },
  externals: config.externals,
  module: {
    rules: [tsLoaderWithPlugins.loaders, pugLoader, jsLoader, stylLoaderMaybeWithPlugins.loaders, imgLoader, fontLoader, mediaLoader, vueLoaderWithPlugins.loaders]
  },
  plugins: [definePlugin, cleanPlugin, copyPlugin, ...vueLoaderWithPlugins.plugins, ...stylLoaderMaybeWithPlugins.plugins, ...tsLoaderWithPlugins.plugins]
}))

module.exports = configs
