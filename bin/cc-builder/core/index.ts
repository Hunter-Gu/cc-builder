import build = require('./build');
import plugin = require('./plugin');
import util = require('../utils');
import config = require('./config');
import { exec, IPlatform } from './exec';

const CONFIG_FILE = config.default.configFile;

export interface IConfig {
  name: string[] | string;
  template: string;
  temps: string[];
  platforms: IPlatform[];
  app: string;
  [name: string]: any;
}

let configs: IConfig[];

if (util.isFile(util.resolve(CONFIG_FILE))) {
  configs = require(util.resolve(CONFIG_FILE));
}

function start() {
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
