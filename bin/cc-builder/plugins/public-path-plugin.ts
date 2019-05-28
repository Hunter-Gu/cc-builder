import $path = require('path');
import $fs = require('fs');
import shelljs = require('shelljs');
import glob = require('glob');
import babylon = require('babylon');
import traverse, { NodePath } from 'babel-traverse';
import * as t from 'babel-types';
import generator from 'babel-generator';
import builder from '../core';
import { IPlatform } from '../core/exec';
import pluginUtil = require('./plugin-util');
import { readFileSync, getDimPath } from '../utils/index';

// 处理的文件的后缀， 注意， 此处的处理只通过字符串匹配， 而不通过 ast
// 字符串匹配的处理需要添加引号， ast 的不需要
const exts = ['.html', '.css'];
const astFiles = ['main.js'];
// 替换的模板标记
const BASE_PRIVATE = '{{{(.*)}}}';
const BASE_PUBLIC = '{{(.*)}}';
const QUTOS = [`\\'`, `\\"`];
const addQutos = (baseStr: string) =>QUTOS.reduce((acc, cur) => (acc + '|' + cur + baseStr + cur), '').slice(1);
const QUTOS_PRIVATE = addQutos(BASE_PRIVATE);
const QUTOS_PUBLIC = addQutos(BASE_PUBLIC);

// const publicPath = '/static/'
// const buildPath = '/Users/hunter/prj/vfe/tide-game/release/pick-easter-egg'
// const gameName = 'pick-easter-egg'

const replacer = (privateStr: string, publicStr: string) => (
  publicPath: string,
  gameName: string
) => {
  const selector = (p1: string | undefined, p2: string) => typeof p1 === 'undefined' ? p2 : p1
  const privateStaticPath = (match: string, p1: string, p2: string) =>
    `"${$path.join(publicPath, gameName, selector(p1, p2))}"`;
  const staticPath = (match: string, p1: string, p2: string) =>
    `"${$path.join(publicPath, selector(p1, p2))}"`;

  return (str: string) =>
    str
      .replace(new RegExp(privateStr, 'g'), privateStaticPath)
      .replace(new RegExp(publicStr, 'g'), staticPath);
};
const htmlReplace = replacer(QUTOS_PRIVATE, QUTOS_PUBLIC);
const jsReplace = replacer(BASE_PRIVATE, BASE_PUBLIC);

builder.register(function(compiler) {
  // 替换 html, css 中的路径
  // 替换 main.js 中的路径
  compiler.tap('AfterEach', function(arr) {
    let {
      paths: { buildPath },
      platform
    } = pluginUtil.parseParams(arr);
    const gameName = $path.basename(<string>buildPath);
    const publicPath = (<IPlatform>platform).publicPath || '';
    const files = exts.map(ext => $path.join(<string>buildPath, '*' + ext));

    files.forEach(file => {
      glob.sync(file).forEach(f => {
        // 先将 private 的进行替换， 在替换 static 以免 {{(.+)}} 和 {{{(.+)}}} 冲突
        const content = htmlReplace(publicPath, gameName)(readFileSync(f));

        $fs.writeFileSync(f, content);
      });
    });

    astFiles.forEach(file => {
      const ext = $path.extname(file);
      file = $path.basename(file, ext) + '*' + ext;
      const mainJsFile = getDimPath($path.join(<string>buildPath, file));
      const content = readFileSync(mainJsFile);
      const ast = babylon.parse(content, {
        sourceType: 'module'
      });

      traverse(ast, {
        enter(path) {
          if (t.isStringLiteral(path.node)) {
            if (
              typeof path.node.value === 'string' &&
              (new RegExp(BASE_PRIVATE, 'g').test(path.node.value) ||
                new RegExp(BASE_PUBLIC, 'g').test(path.node.value))
            ) {
              // 因为拿到的是 '"a/b/c"' 这样的字符串
              path.node.value = jsReplace(publicPath, gameName)(
                path.node.value
              ).replace(/\"/g, '');
            }
          }
        }
      });

      $fs.writeFileSync(mainJsFile, generator(ast, {
        compact: true,
        minified: true,
        concise: true
      }).code);
    });
  });
});
