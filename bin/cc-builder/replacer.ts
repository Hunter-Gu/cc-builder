require('colors')
import $os = require('os')
import $path = require('path')
import shelljs = require('shelljs')
import glob = require('glob')
import util = require('./utils/index')

const packagePath = (version: string) => $path.join($os.homedir(), `.CocosCreator/packages/build-template/${version}/replace`)
const PREVIEW_PKG = 'preview-templates'
const BUILD_PKG = 'build-templates'

/**
 * @description 主要用于设置开发时的模板， 会将指定的模板拷贝到 .CocosCreator/packages/build-template/${version}/replace 下， 原来的模板会被修改为 replace-n
 * @param template
 * @param version
 * @param platform
 */
export function devReplacer (template: string, version: string, platform = 'web-mobile') {
  const replacePkg = packagePath(version)
  creatorExist(NonBaseName(replacePkg))
  const previewTemplate = $path.join(template, PREVIEW_PKG, platform)
  const buildTemplate = $path.join(template, BUILD_PKG, platform)

  // 替换为 replace-n
  if (util.isExists(replacePkg)) {
    const pkgs = glob.sync(replacePkg + '-*')
    const extract = /replace-(\d+)/
    let max = 0
    pkgs.forEach(pkg => {
      const pkgName = $path.basename(pkg)
      const cnt = parseInt((<RegExpMatchArray>pkgName.match(extract))[1])
      if (cnt > max)
        max = cnt
    })
    max += 1
    shelljs.mv(replacePkg, replacePkg + '-' + max)
  }
  // 这个只能在此处， 否则会覆盖原来的
  shelljs.mkdir(replacePkg)
  util.sinkCopy(previewTemplate, $path.join(replacePkg, PREVIEW_PKG))
  util.sinkCopy(buildTemplate, $path.join(replacePkg, BUILD_PKG))
}

/**
 * @description 去除 basename 后的路径
 * @param path
 */
export function NonBaseName (path: string) {
  return path.split($path.sep).slice(0, -1).join($path.sep)
}

/**
 * @description devReplacer 的逆操作， 将 replace 文件夹被 replace-{max} 替代
 * @param version
 */
export function rollbackReplacer (version: string) {
  const replacePkg = packagePath(version)
  creatorExist(NonBaseName(replacePkg))

  const pkgs = glob.sync(replacePkg + '-*')
  const extract = /replace-(\d+)/
  let max = 0
  pkgs.forEach(pkg => {
    const pkgName = $path.basename(pkg)
    const cnt = parseInt((<RegExpMatchArray>pkgName.match(extract))[1])
    if (cnt > max)
      max = cnt
  })
  // // 如果没有则不进行操作
  if (max > 0) {
    shelljs.rm('-r', replacePkg)
    shelljs.mv(replacePkg + '-' + max, replacePkg)
  }
}

/**
 * 判断该版本的 creator 是否存在
 */
function creatorExist (path: string) {
  if (!util.isExists(path)) {
    const version = $path.basename(path)
    console.log(`Cocos Creator ${version} is not installed`.red)
    process.exit(1)
  }
}
