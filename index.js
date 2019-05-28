const $path = require('path')
const shelljs = require('shelljs')
const { curDir } = require('./.bin/utils')

module.exports = Object.assign({

}, {
  template () {
    shelljs.exec(`NODE_ENV=production node ${curDir('bin/webpack/build.js')}`)
  }
}, require('./.bin').default)
