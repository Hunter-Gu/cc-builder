const $path = require('path')
const webpack = require('webpack')
const { curDir } = require('../../.bin/utils')
const webpackConf = require(curDir('bin/webpack/webpack.prod.conf.js'))

webpack(webpackConf, function (err, stats) {
  if (err) {
    console.error(err.stack || err)
    if (err.details) {
      console.error(err.details)
    }
  } else {
    process.stdout.write(stats.toString('normal') + '\n\n')
    process.exit(0)
  }
})
