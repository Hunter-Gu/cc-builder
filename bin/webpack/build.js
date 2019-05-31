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
    process.exit(1)
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(`[Error]: Webpack compile error --- build templates error\n${info.errors}`.bold.red);
    process.exit(1)
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings.yellow);
  }

  process.stdout.write(stats.toString('normal') + '\n\n')
  process.exit(0)
})
