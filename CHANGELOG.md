# Change Log

## 1.0.4-0 (2019-06-19)

- 将 package.json 中所有 dependencies 移到 devDependencies 中
- postinstall 先执行 `npm install`

## 1.0.3 (2019-06-06)

fix:

- 编译成 Vue 的 SFC 组件时， 将 main.js 中最外层 IIF 的 window 参数修改为变量 vm， 而不再是 this 对象， 因为当前的 this 不是组件的上下文。 所以使用时， 需要传递 vm 参数， 方式如下：

```js
export default {
  name: '',
  mounted () {
    this.main(this)
  },
  methods: {
    // vm 必须有， 且必须名为 vm
    main (vm) {
      // main.js 编译后会需要变量 vm
      __cc__require__('main.js')
    }
  }
}
```


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
