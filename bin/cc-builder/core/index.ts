import build = require('./build');
import plugin = require('./plugin');
import util = require('../utils');
import config = require('./config');
import { exec, IPlatform } from './exec';

const CONFIG_FILE: string[] = config.default.configFile;

export interface IConfig {
  name: string[] | string;
  template: string;
  temps: string[];
  platforms: IPlatform[];
  app: string;
  [name: string]: any;
}



let configs: IConfig[];
const requireConfig = function (): string {
  return CONFIG_FILE.filter((file) => {
    file = util.resolve(file)
    if (util.isFile(file)) return !!file
    else return false
  })[0]
}

const configFile = requireConfig()

if (!configFile) {
  console.error(`[Error]: Can't find config file [${CONFIG_FILE}]`.red.bold)
  process.exit(1)
} else {
  configs = require(util.resolve(configFile))
}

function start() {
  if (!Array.isArray(configs))
    configs = [configs]

  configs.forEach(config => {
    const {
      name: prjNames,
      template,
      temps: tempPaths,
      platforms,
      app
    } = config;
    const getPaths = (prjName: string) => ({
      name: prjName,
      template: template,
      tempPaths: tempPaths
    });

    if (typeof prjNames === 'string') {
      exec(getPaths(prjNames), platforms, config, app);
    } else if (Array.isArray(prjNames)) {
      prjNames.forEach(prjName => {
        exec(getPaths(prjName), platforms, config, app);
      });
    }
  });
}

export default {
  register: plugin.register,
  start
};
