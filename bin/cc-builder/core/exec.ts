require('colors');
import $path = require('path');
import glob = require('glob');
import build = require('./build');
import util = require('../utils');
import config = require('./config');
import { IConfig } from './index';
import { Plugin, plugins } from './plugin';

const BUILD_TEMPLATE = config.default.buildTemplate
const DEFAULT_TEMPLATE_PATH = config.default.defaultTemplatePath
const TEMP_BUILD_PATH_NAME = config.default.tempBuildPathName;
const COMPILE_FILE = config.default.compileFile;

export interface IPlatform {
  buildPath: string;
  platform: build.EPlatform;
  externalConfig?: boolean | undefined;
  [name: string]: any;
}

interface IPathSet {
  name: string;
  template: string;
  tempPaths: string[];
}

export interface IPath extends IPathSet {
  buildPath?: string;
  buildTemplate: string;
  tempBuildPath: string;
}

/**
 * @description 执行 config 中每一项
 * @param paths
 * @param platforms
 * @param app
 */
export function exec(
  paths: IPathSet,
  platforms: IPlatform[],
  config: IConfig,
  app?: string
): void {
  const { name, template, tempPaths } = paths;
  glob.sync(name).forEach(prj => {
    _exec(
      {
        name: prj,
        template,
        tempPaths
      },
      platforms,
      config,
      app
    );
  });
}

/**
 * @description 用于构建一个游戏的多个平台
 * @param prjPath 指定游戏的路径
 * @param platforms 平台信息
 * @param app 使用的 cocos creator 版本
 */
function _exec(
  paths: IPathSet,
  platforms: IPlatform[],
  conf: IConfig,
  app?: string
) {
  console.log('Preparing.....................'.bgYellow);
  let { name, template, tempPaths } = paths;
  template = $path.join(DEFAULT_TEMPLATE_PATH, template)
  const gameName = $path.basename(name);
  const buildTemplate = $path.join(template, BUILD_TEMPLATE);
  const tempBuildPath = util.resolve($path.join(name, TEMP_BUILD_PATH_NAME));
  const HOOK_PARAMS = [
    {
      name: name = util.resolve(name),
      template: template = template,
      buildTemplate,
      tempBuildPath,
      tempPaths: tempPaths.map(path => $path.join(name, path))
    },
    platforms,
    null,
    conf
  ];

  if (!util.isDir(name)) {
    console.error(`[ERROR]: game not exist, please check： ${name}`.red.bold);
    return;
  }

  plugins.forEach(func => {
    func(Plugin);
  });

  Plugin.hooks.Before.call(HOOK_PARAMS);

  platforms.forEach((platform: IPlatform) => {
    const pfm = platform.platform;
    const buildPath = util.resolve($path.join(platform.buildPath, gameName));
    const EACH_HOOK_PARAMS = [
      Object.assign({}, HOOK_PARAMS[0], { buildPath }),
      platforms,
      platform,
      conf
    ];
    console.log(
      `Staring build!!!!!!!!!!\ngame: ${name}\nplatform: ${pfm}\nbuildPath: ${buildPath}\napp: ${
        app ? app : 'default app'
      }\ntemplate: ${buildTemplate}`.green.bold
    );
    let config = getConfig(name, buildTemplate, pfm, !!platform.externalConfig);
    if (!config) {
      config = platform.buildParams || null
    }
    Plugin.hooks.BeforeEach.call(EACH_HOOK_PARAMS);
    // 先编译到临时路径
    build.execBuild(name, tempBuildPath, pfm, app, config);
    Plugin.hooks.AfterEach.call(EACH_HOOK_PARAMS);
  });

  Plugin.hooks.After.call(HOOK_PARAMS);

  Plugin.clear();
}

/**
 * @description 获取配置文件的内容
 * @param prjPath 游戏的路径
 * @param pfm 平台
 * @param externalConfig 是否使用外部配置文件
 */
function getConfig(
  prjPath: string,
  buildTemplate: string,
  pfm: build.EPlatform,
  externalConfig: boolean
): build.IParamsBuild | null {
  let config = null;
  let msg = '';

  if (externalConfig) {
    const configFile = $path.join(prjPath, BUILD_TEMPLATE, pfm, COMPILE_FILE);

    if (util.isFile(configFile)) {
      config = require(configFile);
      msg += `external config: [${$path.join(
        buildTemplate,
        pfm,
        COMPILE_FILE
      )}]`;
    } else {
      console.error(
        `[ERROR]: external config file error!\ngame: ${prjPath}\nUsing default config...`
          .red.bold
      );
    }
  } else {
    msg += `default config enabled!\n`;
  }

  console.log(msg.blue.bold);

  return config;
}
