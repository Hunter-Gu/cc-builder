import tapable = require('tapable')
import pluginUtil = require('../plugins/plugin-util')

interface IHook {
  BeforeEach: tapable.SyncHook,
  Before: tapable.SyncHook,
  After: tapable.SyncHook,
  AfterEach: tapable.SyncHook,
}

enum EHook {
  BeforeEach = 'BeforeEach',
  Before = 'Before',
  After = 'After',
  AfterEach = 'AfterEach',
}

interface IHookCallback {
  (arr: pluginUtil.IHookParamsArr): void;
}

interface IPlugin {
  hooks: IHook;
  tap: (type: string, func: IHookCallback) => void;
  clear: () => void;
}

const HOOKS = {
  Before: new tapable.SyncHook(['buildPath']),
  BeforeEach: new tapable.SyncHook(['buildPath']),
  AfterEach: new tapable.SyncHook(['buildPath']),
  After: new tapable.SyncHook(['buildPath']),
}

export const plugins: ((plugin: IPlugin) => void)[] = []

export class Plugin {
  public static hooks: IHook = HOOKS
  constructor () {

  }

  static tap (type: string, func: IHookCallback) {
    if(type in this.hooks) {
      this.hooks[<EHook>type].tap(type, func)
    } else {
      console.error('[ERROR]: only support [Before, BeforeEach, AfterEach, After] hook!')
    }
  }

  static clear () {
    const values = this.hooks
    plugins.length = 0

    Object.keys(values).forEach(hook => {
      values[<EHook>hook].taps = []
    })
  }
}

export function register (funcs: (plugin: IPlugin) => void) {
  plugins.push(funcs)
}
