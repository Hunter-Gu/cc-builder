# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## 1.0.2 (2019-05-31)

fix:

- 修改 webpack 的 resolveLoader 为 cc-builder 下的 node_modules 路径。 否则全局安装使用时， 仍然会从项目路径读取某些 loader

## 1.0.1 (2019-05-31)

feature:

- 配置文件支持 ccrc.json 和 ccrc.js 两种类型， 以 ccrc.json 优先

fix:

- 编译错误时， 应该退出运行

# 1.0.0 (2019-05-10)

feature:

- 读取配置， 进行游戏编译
- 通过 `webpack` 编译模板
- 生成 SFC 文件
- 支持 publicPath 的替换
- 添加设置本地开发模板的功能
- 添加本地开发模板 rollback 的功能
