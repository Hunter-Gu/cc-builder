import $path = require('path')
import shelljs = require('shelljs')
import config = require('./config')

export enum EPlatform {
  webMobile = 'web-mobile',
  jsbLink = 'jsb-link',
  jsbDefault = 'jsb-default'
}

interface IParams {
  path: string;
  build: IParamsBuild;
}

export interface IParamsBuild {
  title: string;
  buildPath: string;
  platform?: EPlatform;
  inlineSpriteFrames?: boolean;
  debug?: boolean;
  packageName?: string;
  md5Cache?: boolean;
  autoCompile?: boolean;
  zipCompressJs?: boolean;
  any?: any;
}

type ParamsKeys = keyof IParams
type BuildParamsKeys = keyof IParamsBuild

const DEFAULT_APP_PATH = config.default.defaultAppPath
const DEFAULT_BUILD_PARAMS = {
  inlineSpriteFrames: true,
  debug: false,
  md5Cache: true,
  autoCompile: true,
  zipCompressJs: true
}

export function execBuild (prjPath: string, buildPath: string, platform: EPlatform, app: string = DEFAULT_APP_PATH, config: IParamsBuild | null): void {
  const name: string = $path.basename(prjPath)
  const params = {
    path: prjPath,
    build: {
      platform,
      buildPath: buildPath,
      title: name,
      md5Cache: true
    }
  }

  if (!config) {
    params.build = Object.assign({}, params.build, DEFAULT_BUILD_PARAMS)
  } else {
    params.build = Object.assign({}, config, params.build)
  }

  shelljs.exec(app + parseQuery(params))
}

function parseQuery (params: IParams): string {
  return Object.keys(params).reduce(function (acc: string, key: string): string {
    let val: IParamsBuild | string = params[<ParamsKeys>key]

    if (typeof <IParamsBuild>val !== 'string') {
      val = Object.keys(val).reduce((a: string, k: string): string => {
        const v = (<IParamsBuild>val)[<BuildParamsKeys>k]
        return a + `${k}=${v};`
      }, '')
    }

    return acc + ` --${key} "${val}"`
  }, '')
}
