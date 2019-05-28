import 'colors'
import $path = require('path')
import $fs = require('fs')
import $readline = require('readline')
import glob = require('glob')
import shelljs = require('shelljs')

/**
 * @description 判断是否存在该路径
 * @param path
 */
export function isDir (path: string): boolean {
  return $fs.statSync(path).isDirectory()
}

/**
 * @description 判断是否存在文件
 * @param filename
 */
export function isFile (filename: string): boolean {
  let result = true

  try {
    result = !!$fs.statSync(filename).isFile()
  } catch (e) {
    result = false
  }

  return result
}

/**
 * @description 判断文件或路径是否存在
 * @param name
 */
export function isExists (name: string): boolean {
  return $fs.existsSync(name)
}

export function curDir (path: string) {
  return $path.join(__dirname, '..', '..', path)
}

/**
 * @description 获取项目根路径
 */
export function root (): string {
  return $path.resolve(process.cwd())
}

/**
 * @description 获取绝对路径
 * @param filename
 */
export function resolve (filename: string): string {
  return $path.join(root(), filename)
}

/**
 * @description 比较文件是否存在指定内容
 * @param file
 * @param content
 */
export function diffFileContent (file: string, content:string): Promise<boolean> {
  const lines = content.split('\n').length
  const input = $fs.createReadStream(file)
  const arr: Queue = new Queue(lines)
  const rl = $readline.createInterface({
    input
  })

  return new Promise(function (resolve, reject) {
    rl.on('line', (line) => {
      arr.push(line)

      if (arr.length === lines) {
        if (arr.content.join('\n') === content) {
          rl.close()
          resolve(true)
        }
      }
    })

    rl.on('close', () => {
      if (arr.content.join('\n') === content) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

class Queue {
  private _size: number;
  private _content: any[];

  constructor (size: number) {
    this._content = []
    this._size = size
  }

  public push (val: any): number {
    if (this._content.length >= this._size) {
      this._content = this._content.slice(1)
    }
    return this._content.push(val)
  }

  public get length(): number {
    return this._content.length
  }

  public get content(): any[] {
    return this._content
  }
}

interface IOptions {
  src: string;
  baseDir?: string;
  verbose?: boolean;
  noskip?: boolean;
  excludes?: string;
  includes?: string;
}

interface IRes {
  [propName: string]: string;
}

export function getEntries (extensions: string[], options: IOptions): object {
  const res: IRes = {}
  options = options || {}
  const verbose = options.verbose || true
  extensions = extensions || ['.js']
  extensions.forEach(function(validExt) {
    const srcDir = options.src
    const files = glob.sync(srcDir + "/**/*" + validExt, <object>options).filter(function(filepath) {
      const extension = $path.extname(filepath)
      const basename = $path.basename(filepath, validExt)
      if (extension != validExt) return false
      if (!options.noskip && basename[0] == '_') return false
      if (!basename.match(/^[A-Za-z_0-9-]+$/)) return false
      /**
       * file is not an entry if it's content
       * start with not entry multiline comment
       */
      var buf = new Buffer(13)
      var fd = $fs.openSync(filepath, 'r')
      $fs.readSync(fd, buf, 0, 13, null)
      var directive = buf.toString()
      $fs.closeSync(fd)
      return directive !== '/*not entry*/'
    })
    const includes = options.includes ? options.includes.split(',') : null
    console.log('includes for ', extensions, includes)
    const excludes = options.excludes ? options.excludes.split(',') : null
    console.log('excludes for ', extensions, excludes)
    files.forEach(function(filepath: string) {
      var key = $path.relative(options.baseDir || options.src, filepath)
      key = key.replace(validExt, '')
      if (includes) {
        if (includes.indexOf(key) < 0) return
      } else if (excludes) {
        if (excludes.indexOf(key) >= 0) return
      }
      res[key] = filepath
    })
  })
  if (verbose) {
    console.log(('Entries for ' + extensions.join(' and ')).cyan.bold)
    for (var k in res) {
      console.log(k.green, '=>\n  ', res[k].yellow)
    }
  }
  if (!Object.keys(res).length) {
    console.error('!!!Got no entry for ' + extensions + '!!!')
  }
  return res
}

/**
 * 将指定路径下的所有文件， 复制到目标路径
 * @param from
 * @param to
 */
function traversalCp (from: string, to: string) {
  glob.sync($path.join(from, '**', '*.*')).forEach(path => {
    path = path.replace($path.join(from), '')
    path = path.split($path.sep)[1]
    shelljs.cp('-r', $path.join(from, path), to)
  })
}

/**
 * @description 无差别 copy
 * @param from
 * @param to
 */
export function indisCopy (from: string, to: string) {
  if (isDir(from)) {
    shelljs.cp('-r', from, to)
  } else {
    shelljs.cp(from, to)
  }
}

/**
 * @description 将文件夹下的所有文件， copy 到指定路径下
 * @param fromPath
 * @param to
 */
export function sinkCopy (fromPath: string, to: string) {
  if (!isExists(to)) {
    shelljs.mkdir(to)
  }
  // 只拷贝需要的文件（cocos creator 构建时会产生很多无用文件)
  glob.sync($path.join(fromPath, '*')).forEach(path => {
    indisCopy(path, to)
  })
}

/**
 * @description 将一个通配符路径， 转化为当前实际的路径
 * @param path
 */
export function getDimPath (path: string): string {
  return shelljs.exec(`find ${path} -maxdepth 0`).toString().trim()
}

/**
 * @description 同步读取文件
 * @param filepath
 */
export function readFileSync(filepath: string): string {
  return $fs.readFileSync(filepath).toString();
}
