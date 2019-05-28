const $path = require('path');

require('colors')

const resolve = function (dir = '') {
  return $path.join(__dirname, '..', '..', dir)
}

const root = function (path) {
  return $path.join(process.cwd(), path)
}

const DEV_ALIAS = 'development'
const PROD_ALIAS = 'production'
const DEV = 'dev'
const PROD = 'prod'
const IS_DEV = process.env.NODE_ENV === 'production' ? false : true

module.exports = {
  isdev: IS_DEV,
  env: IS_DEV ? DEV : PROD,
  paths: {
    src: root('./template/templates'),
    build: resolve('.template'),
    root: resolve(),
    cache: true,
  },
  [DEV]: {
    env: {
      NODE_ENV: DEV_ALIAS
    },
    assetsPublicPath: '/static/',
    publicPath: '/static/',
    assetsRoot: resolve('.template')
  },
  [PROD]: {
    env: {
      NODE_ENV: PROD_ALIAS
    },
    assetsPublicPath: '/static/',
    publicPath: '/static/',
    assetsRoot: resolve('.template')
  },
  alias: {

  }
}
