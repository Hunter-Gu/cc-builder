import executor = require('../core/exec')
import { IConfig } from '../core/index'

/**
 * @description 解析 hook callback 的参数
 * @param arr
 */

export interface IHookParamsArr {
  0: executor.IPath;
  1: executor.IPlatform[];
  2: executor.IPlatform | null;
  3: IConfig
}

interface IHookParams {
  paths: executor.IPath;
  platforms: executor.IPlatform[];
  platform: executor.IPlatform | null;
  config: IConfig
}

export function parseParams (arr: IHookParamsArr): IHookParams {
  return {
    paths: arr[0],
    platforms: arr[1],
    platform: arr[2],
    config: arr[3]
  }
}

/**
 * @description 职责链模式
 * @example
 *  const chain1 = new Chain(cb1)
 *  const chain2 = new Chain(cb2)
 *  const chain3 = new Chain(cb3)
 *
 *  chain1.setNext(chain2)
 *  chain1.setNext(chain3)
 */
export class Chain {
  current: (...args: any[]) => boolean | undefined = (...args) => false;
  next: Chain | null = null;

  constructor (node: (...args: any[]) => boolean | undefined) {
    this.current = node
  }

  invoke (...args: any[]) {
    const result = this.current(...args)

    if (result === false) {
      if (this.next instanceof Chain) {
        (<Chain>this.next).invoke(...args)
      }
    }
  }

  setNext (chain: Chain) {
    this.next = chain
  }
}
