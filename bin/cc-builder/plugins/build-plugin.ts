import $path = require('path')
import shelljs = require('shelljs')
import glob = require('glob')
import util = require('../utils')
import pluginUtil = require('./plugin-util')
import executor = require('../core/exec')
import config = require('../core/config')
import builder from '../core'
const COMPILE_FILE = config.default.compileFile
const EXCLUDE_TEMPLATE_FILES = [COMPILE_FILE]
const RES_SET = ['res', 'src']

builder.register(function (compiler) {
  const cleanTemps = function (arr: pluginUtil.IHookParamsArr) {
    let { paths: { tempBuildPath, tempPaths } } = pluginUtil.parseParams(arr)
    shelljs.rm('-r', tempBuildPath)
    shelljs.rm('-r', ...tempPaths)
  }

  // 将模板下的所有文件 copy 到项目路径下
  compiler.tap('Before', function cpTemplate (arr) {
    const { paths: { template, name } } = pluginUtil.parseParams(arr)
    cleanTemps(arr)
    shelljs.cp('-r', $path.join(template, '*'), name)
  })

  // 清除原来构建出来的内容
  compiler.tap('BeforeEach', function revolute (arr) {
    const { paths: { buildPath } } = pluginUtil.parseParams(arr)

    shelljs.rm('-r', <string>buildPath)
    shelljs.mkdir('-p', <string>buildPath)
  })

  // 将编译后的内容 copy 到指定路径下
  compiler.tap('AfterEach', function copyRes (arr) {
    let { paths: { buildPath, buildTemplate, tempBuildPath }, platform } = pluginUtil.parseParams(arr)
    const pfm = (<executor.IPlatform>platform).platform
    /**
     * @description 模糊匹配文件， 文件夹的路径会直接返回
     */
    const getDimResPath = (path: string) => {
      path = $path.join(tempBuildPath, pfm, path)
      console.log((path + ' --->').blue)
      path = util.getDimPath(path)
      return path
    }
    buildTemplate = $path.join(buildTemplate, pfm)

    // 只拷贝需要的文件（cocos creator 构建时会产生很多无用文件)
    glob.sync($path.join(buildTemplate, '*')).forEach(path => {
      const ext = $path.extname(path)
      path = $path.join($path.dirname(path), $path.basename(path).replace(ext, '*' + ext))
      path = $path.relative(buildTemplate, path)

      if (EXCLUDE_TEMPLATE_FILES.indexOf(path) === -1) {
        util.indisCopy(getDimResPath(path), <string>buildPath)
      }
    })

    RES_SET.forEach(path => {
      util.indisCopy(getDimResPath(path), <string>buildPath)
    })
  })

  compiler.tap('After', function clean (arr) {
    cleanTemps(arr)
  })
})
