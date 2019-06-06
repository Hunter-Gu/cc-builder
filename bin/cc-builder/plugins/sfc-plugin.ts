import('colors');
import $path = require('path');
import $fs = require('fs');
import shelljs = require('shelljs');
import HTML = require('html-parse-stringify');
import babylon = require('babylon');
import traverse, { NodePath } from 'babel-traverse';
import * as t from 'babel-types';
import generator from 'babel-generator';
import util = require('../utils/index');
import pluginUtil = require('./plugin-util');
import builder from '../core';
import { IPlatform } from '../core/exec';

const VUE_TEMPLATE = 'vue-template.vue';
const CC_REQUIRE = '__cc__require__';
const CANVAS_ID = 'GameCanvas'
const getSfcTmplPath = (buildPath: string) => {
  return util.getDimPath($path.join(buildPath, VUE_TEMPLATE.replace('.vue', '*.vue')))
}
const readVueTemplate = (buildPath: string) => {
  return util.readFileSync(getSfcTmplPath(buildPath));
};

builder.register(function(compiler) {
  compiler.tap('AfterEach', function(arr) {
    const {
      paths: { name, buildPath },
      platform,
      config
    } = pluginUtil.parseParams(arr);
    const gameName = $path.basename(name);
    const sfcPath = !!(<IPlatform>platform).sfcPath
      ? $path.join(util.resolve((<IPlatform>platform).sfcPath), gameName)
      : <string>buildPath;
    const filename = $path.join(sfcPath, gameName + '.vue');
    const sfcTplPath = getSfcTmplPath(<string>buildPath)

    if (!util.isExists(sfcTplPath)) {
      return
    }
    const result = getSfcResult(<string>buildPath);
    shelljs.rm(sfcTplPath);
    console.log(
      `SFC generating......\nFilename: ${gameName}.vue\nPath: ${sfcPath}`.green
        .bold
    );

    if (!(util.isExists(sfcPath) && util.isDir(sfcPath))) {
      shelljs.mkdir('-p', sfcPath);
    }
    $fs.writeFileSync(filename, result);
    console.log(`File: ${filename} Generates successfully!`.green.bold);
  });
});

/**
 * @description 得到处理后的 .vue 文件内容
 * @param buildPath
 */
function getSfcResult(buildPath: string): string {
  const name = $path.basename(buildPath)
  const html = readVueTemplate(buildPath);
  const ast = HTML.parse(html, {
    components: []
  })
  /**
   * @description 遍历 html 的 ast 节点
  */
  function walk (nodes: HTML.IDoc[]) {
    nodes.forEach((node: HTML.IDoc) => {
      handle(node)
      if (node.children && node.children.length) {
        walk(node.children)
      }
    })
  }

  walk(ast)

  /**
   * @description 修改 html 的 ast 节点
   * @param node
   */
  function handle (node: HTML.IDoc) {
    if (node.type === 'tag' && node.name === 'canvas') {
      node.attrs = {
        id: name
      }
    }

    if (node.type === 'tag' && node.name === 'script') {
      const script: HTML.IDoc = <HTML.IDoc>node.children[0]
      if (script.type === 'text') {
        script.content = parseSfc(<string>script.content, buildPath).code
      }
    }
  }

  return HTML.stringify(ast)

}

/**
 * @description 处理 js 内容
 * @param js js 代码
 * @param buildPath 构建路径
 */
function parseSfc (js: string, buildPath: string) {
  const ast = babylon.parse(js, {
    sourceType: 'module'
  });
  const gameName = $path.basename(buildPath)
  // 设置 SFC 文件的 name 属性
  const setSfcName = (path: NodePath) => {
    if (!t.isStringLiteral(path.node, { value: 'GameCanvas' })) {
      return false
    }

    ;(<t.StringLiteral>path.node).value = gameName
  }

  // 解析 __cc__require__ 处理的 .js 文件
  const parseCcRequire = (path: NodePath) => {
    if (!t.isStringLiteral(path.node)) {
      return false
    }

    const filepath = $path.join(
      buildPath,
      (<t.StringLiteral>path.node).value
    );
    const content = util.readFileSync(filepath);
    const _ast = babylon.parse(content, {
      sourceType: 'module'
    })

    traverse(_ast, {
      enter (path) {
        if (t.isCallExpression(path.parent) && t.isIdentifier(path.node, { name: 'window'})) {
          path.node.name = 'vm'
        } else if (t.isStringLiteral(path.node, { value: CANVAS_ID })) {
          (<t.StringLiteral>path.node).value = gameName
        }
      }
    })

    path.parentPath.insertAfter(_ast);
    path.parentPath.remove();
  }

  let next = false;

  traverse(ast, {
    enter(path) {
      if (next) {
        const sfcNameChain = new pluginUtil.Chain(setSfcName)
        const ccRequireChain = new pluginUtil.Chain(parseCcRequire)

        sfcNameChain.setNext(ccRequireChain)
        sfcNameChain.invoke(path)
      }

      // 防止误处理
      if (!next && (t.isIdentifier(path.node, { name: CC_REQUIRE }) || t.isIdentifier(path.node, { name: 'name' }))) {
        next = true;
      } else {
        next = false;
      }
    }
  });

  return generator(ast);
}
