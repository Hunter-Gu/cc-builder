const $path = require('path')
const $fs = require('fs')
const glob = require('glob')
const prettyjson = require('prettyjson')

require('colors')

/**
 * 判断是否是对象
 * @param {Object} obj
 * @return {Boolean}
 */
const isPlainObj = function (obj) {
  return Object.prototype.toString.call(obj) === '[object Object]'
}

exports.isPlainObj = isPlainObj

/**
 * 判断是否是正则表达式
 * @param {RegExp} regexp
 * @return {Boolean}
*/
const isRegExp = function (regexp) {
  return Object.prototype.toString.call(regexp) === '[object RegExp]'
}

/**
 * 转换为常量风格的变量命名类型， 如 aBbCcc ---> A_BB_CCC
 * @param {*} str
 */
const constCase = function (str) {
  return str.replace(/[A-Z]/g, function (match) {
    return '_' + match.toLowerCase()
  }).toUpperCase()
}

exports.constCase = constCase

/**
 * 转换为数组
 * @param {*} val
 * @return {Array}
 */
const toArray = function (val) {
  return Array.isArray(val) ? val : val ? [val] : []
}

exports.toArray = toArray

/**
 * 函数只执行一次
 * @param {Function} func
 * @retrun {Function}
 */
const once = function (func) {
  let called = false

  return function (...args) {
    if (called) return
    called = true
    return func.apply(this, args)
  }
}

exports.once = once

/**
 * @description 寻找指定后缀的文件名
 * @param {String} ext 后缀
 * @param {*} opts glob 配置项， 新增了 skips, includes, excludes, path
 *  path: 寻找的路径
 *  skips: 可以跳过的项， Array 类型， 元素支持 String 和 RegExp； String 类型时， 忽略以该 string 开头的文件
 *  includes: 指定后， 不再扫描 path 下的所有文件， 只是去寻找 include 的文件
 *  excludes: 指定后， 扫描时排除这些文件， includes 存在时， 该项不生效
 */
const getFilesByExt = function (ext, opts) {
  const map = {}
  const { path: basePath, skips: _skip, verbose, includes: _includes, excludes: _excludes } = opts
  const skips = toArray(_skip)
  const includes = toArray(_includes)
  const excludes = toArray(_excludes)
  const canSkip = function (name) {
    name = $path.basename(name, $path.extname(name))
    return skips.some(skip => {
      if (typeof skip === 'string') {
        return name.startsWith(skip)
      } else if (isRegExp(skip)) {
        return skip.test(name)
      } else {
        throw new Error('Error: Skips can only contain String or RegExp type')
      }
    })
  }

  if (includes.length) {
    includes.forEach(include => {
      const key = include.replace(new RegExp(ext + '$'), '')
      map[key] = $path.resolve(basePath, key + ext)
    })
    console.log(`Includes works! ${includes}`.magenta.red)
  } else {
    glob.sync('/**/*' + ext, Object.assign({}, opts, {
      root: basePath
    })).filter(filename => {
      const name = $path.basename(filename)
      const noskip = !canSkip(name) && (excludes.length && excludes.indexOf(name) < 0 || !excludes.length)

      if (noskip) {
        const key = $path.relative(basePath, filename).replace(ext, '')
        map[key] = filename
      }

      return noskip
    })
  }

  if (verbose) {
    console.log(`Extension [${ext}]:\n`.bold.blue + prettyjson.render(map) + '\n')
  }

  return map
}

exports.getFilesByExt = getFilesByExt

/**
 * @description 获取 jade 中指定标签的属性
 * @content {String} jade 文件的内容
 * @attributes {Array} 指定的标签及其属性
 * @return {Array} 寻找到的 urls
 */
const getJadeUrl = function (content, attributes) {
  const Parser = require('fastparse')
  const isRelevantTagAttr = function(tag, attr) {
    return attributes.indexOf(tag + ":" + attr) >= 0;
  }
  const processMatch = function(match, strUntilValue, name, value, index) {
    if(!isRelevantTagAttr(this.currentTag, name)) return;
    this.results.push({
      start: index + strUntilValue.length,
      length: value.length,
      value: value
    });
  };

  const parser = new Parser({
    outside: {
      '([a-zA-Z\\-:]+)([\\.#a-zA-Z0-9\\-_]*)\\(\\s*': function (match, tagName, classAndId) {
        this.currentTag = tagName
        this.classAndId = classAndId
        return 'inside'
      }
    },
    inside: {
      '\\s+': true,
      '\\)': 'outside',
      "(([0-9a-zA-Z\\-:\.]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
      "(([0-9a-zA-Z\\-:\.]+)\\s*=\\s*\')([^\']*)\'": processMatch,
      "(([0-9a-zA-Z\\-:\.]+)\\s*=\\s*)([^\\s\\)]+)": processMatch
    }
  })

  return parser.parse('outside', content, { results: [] }).results
}

exports.getJadeUrl = getJadeUrl

/**
 * @description 根据 jade 文件获取 entries
 * @src {String} html 文件的路径， 只会从该路径下寻找 html 文件
 * @assetsPublicPath
 */
const getEntriesByJade = function (src, assetsPublicPath, options) {
  const includes = options.includes ? options.includes.split(',') : null
  const excludes = options.excludes ? options.excludes.split(',') : null
  const jade = getFilesByExt('.jade', {
    path: $path.join(src, 'html'),
    skips: ['_'],
    verbose: true,
    includes,
    excludes
  })
  const jadeFiles = Object.values(jade)
  const entries = {
    '.jade': jade
  }

  jadeFiles.forEach(file => {
    const fileContent = $fs.readFileSync(file)
    const urls = getJadeUrl(fileContent, ['img:src', 'script:src', 'link:href'])

    urls.forEach(url => {
      const extname = $path.extname(url.value)
      const entry = url.value.replace(new RegExp('^' + assetsPublicPath), '')
      const entryKey = $path.join(...entry.split($path.sep).slice(1)).replace(new RegExp(extname + '$'), '')

      if (!entries[extname])
        entries[extname] = {}

      entries[extname][entryKey] = $path.join(src, entry)
    })
  })

  return entries
}

exports.getEntriesByJade = getEntriesByJade

const getFilename = function (isdev, ischunk, ext = 'js',  path = '') {
  const hash = isdev ? ''
              : typeof ischunk === 'string' ? '-' + ischunk
              : !!ischunk ? '-[chunkhash]' : '-[hash]'
  return $path.join(path, `[name]${hash}.${ext}`)
}

exports.getFilename = getFilename

const webpackCallback = function (err, stats, cb) {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return
  }

  const info = stats.toJson('minimal');

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }

  process.stdout.write(prettyjson.render(info) + '\n')

  cb && cb()
}

exports.webpackCallback = webpackCallback

const resolve = function (dir = '') {
  return $path.join(process.cwd(), dir)
}

exports.resolve = resolve

const curRoot = function (dir = '') {
  return $path.join(__dirname, '..', '..', dir)
}

exports.curRoot = curRoot
