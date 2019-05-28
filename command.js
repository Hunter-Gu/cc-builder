#!/usr/bin/env node
const program = require('commander')
const $path = require('path')
const pkg = require('./package.json')
const builder = require('./index')
const config = require('./.bin/core/config').default
const wpConfig = require('./bin/webpack/config')
const util = require('./.bin/utils/index')
const { devReplacer, rollbackReplacer } = require('./.bin/replacer')
const { EPlatform } = require('./.bin/core/build')
const safeExit = cmd => msg => {
  console.log(cmd + msg)
  process.exit(1)
}

program
  .version(pkg.version)

function validCmdOpt (opt) {
  return typeof opt !== 'undefined'
}

/**
 * @description 参数要么同时为 true， 要么同时为 false
 * @param  {...any} args
 */
function LiveAndDieTogether (...args) {
  return args.every(arg => arg === true) || args.every(arg => arg === false)
}

program
  .command('template')
  .option('-r, --replace [template-name]')
  .option('-c, --cocosVersion [creator-version]')
  .option('-p, --platform [platform]')
  .action(function (cmd) {
    const { replace: replacer, platform, cocosVersion } = cmd
    const errMsg = safeExit(`ssb template -r {template-name} -c {creator-version} [-p = platform]: `)

    // 先判断 replace mode 需要的参数， 避免无效的编译
    if (!LiveAndDieTogether(validCmdOpt(replacer), validCmdOpt(cocosVersion))) {
      errMsg('missing required options `template-name` and `creator-version`')
    }

    if (validCmdOpt(platform)) {
      const platforms = Object.values(EPlatform)
      if (platforms.indexOf(platform) === -1) {
        errMsg('Argument platform can only be one of ' + Object.values(platforms))
      }
    }

    // 判断 replace mode 下的模板是否存在
    if (validCmdOpt(replacer)) {
      const template = $path.join(wpConfig.paths.src, replacer)
      if (!util.isExists(template)) {
        errMsg(`template ${replacer} is not found`)
      }
    }

    builder.template()

    // replace mode
    // 把指定的模板 copy 到 ~/.CocosCreator/... 下
    if (validCmdOpt(replacer)) {
      const template = $path.join(config.defaultTemplatePath, replacer)
      // 避免编译出错的情况
      if (!util.isExists(template)) {
        errMsg(`Unknow error happen, please retry`)
      }
      if (!!platform)
        devReplacer(template, cocosVersion, platform)
      else
        devReplacer(template, cocosVersion)
    }
  })

program
  .command('rollback <creator-version>')
  .action(function (creatorVersion, cmd) {
    rollbackReplacer(creatorVersion)
  })

program
  .command('build')
  .action(function () {
    builder.start()
  })

program.parse(process.argv)
