const baseConfs = require('./webpack.base.conf')
const plugins = require('./plugins')
const prodPlugins = plugins.getProdHelperPlugins()

baseConfs[0].plugins = prodPlugins.concat(baseConfs[0].plugins)

module.exports = baseConfs
