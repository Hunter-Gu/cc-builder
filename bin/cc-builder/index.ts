import builder from './core'

require('./plugins/build-plugin')
// 不要调换先后顺序
require('./plugins/public-path-plugin')
require('./plugins/sfc-plugin')

export default builder
