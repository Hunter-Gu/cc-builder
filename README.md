# cc-builder

Cocos Creator cmd builder tool.

## 安装：

```shell
$ npm install -D cc-builder
```

通过在项目中直接引用 builder 即可：

```js
const builder = require('cc-builder')
```

builder 提供了如下方法：

- `template()` 开始编译模板
- `register()` 注册插件
- `start()` 开始构建

## ccb-cli

通过 ccb 命令可以启动模板构建和 cocos creator 的构建：

- `$ ccb template` 进行模板编译
- `$ ccb build` 进行 cocos creator 的构建
- `$ ccb template && ccb build` 就可以执行整个构建流程
- `$ ccb template -r {template-name} -c {creatorVersion} [-p {platform} = 'web-mobile']` 将指定的模板设置为开发时的 preview-template
- `$ ccb rollback {creatorVersion}` 是上述命令的逆操作， 会将 replace-{max} 替换为 replace

> 注意
>> 当你通过 `builder.register()` 注册了插件后， 那就不应该通过 `ccb` 命令启动编译了， 应该通过 `builder.start()` 启动， 否则注册的插件不会起作用。

## ccrc.json/ccrc.js

项目根路径下的 ccrc.json/ccrc.js 文件会被作为构建时的配置文件， 其配置项如下所示：

| 字段      | 类型     | 说明                                                                                                                                                                | 默认值                                                     |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| name      | string   | array                                                                                                                                                               | 编译的游戏路径， 支持 glob                                 |
| template  | string   | 当前配置使用的模板的名称                                                                                                                                            |
| temps     | array    | 因为编译会产生临时路径， 导致 git 会有很多更改， 通过指定该项把这些临时路径删除                                                                                     |
| platforms | object[] | 多平台编译时， 通过该项编译到不同的路径下，其结构为 { buildPath: ..., platform: ..., externalConfig: boolean, buildParams: ... }， 表示输出路径和使用的平台, 以及编译时使用的编译参数 |
| app       | string   | 当涉及多个版本的 Cocos Creator 时， 通过该项指定使用的版本进行编译                                                                                                  | /Applications/CocosCreator.app/Contents/MacOS/CocosCreator |

platforms 属性的 externalConfig 字段， 用于指定编译时是否使用外部的配置文件， 默认的编译参数是:

```js
{
  platform: 平台, // 通过 platforms.platform 设置
  buildPath: 发布路径, // 通过 platforms.buildPath 设置
  title: 游戏名, // 不可配置
  inlineSpriteFrames: true,
  debug: false,
  md5Cache: false,
  autoCompile: true,
  zipCompressJs: true
}
```

## templates

当需要添加新的模板时，请遵守如下步骤：

- 1.在根路径的 template/templates 路径下新建一个模板文件夹， 如 template-mobile
- 2.该文件夹的目录结构为

```
{{template-name}}
  |-- build-templates
    |-- jsb-default
    |-- jsb-link
    |-- web-mobile
      -- config.json 注意该文件
      -- index.html
      -- main.js
      -- index.css
      -- ...
  |-- packages
    |-- builder1
      -- package.json
      -- main.js
    |-- builder2
    |-- builder3
    |-- ...
```

其中 packages 表示用于自定义扩展包， 具体请看[文档](https://docs.cocos.com/creator/manual/zh/extension/your-first-extension.html)。 扩展包不是构建时必须的， 所以有可能不涉及。

### 额外配置参数

注意上述每个平台下的 config.json 文件， 该文件是编译不同平台时的[构建参数](https://docs.cocos.com/creator/manual/zh/publish/publish-in-command-line.html#%E6%9E%84%E5%BB%BA%E5%8F%82%E6%95%B0)文件， 通过 platforms 的 externalConfig 指定是否使用该文件。

外部配置文件的 platform, buildPath, title 这三个属性会被忽略， 详见[说明](#ccrc)。

你也可以在 ccrc.json 文件中定义构建参数， 通过 buildParams 属性指定即可。

为了代码更好的复用和可读性， template 中的 main.js 是支持模块化的， main.js 文件会被 webpack 打包处理， 最终编译到 .template 路径下。

### 设置本地的模板

可以通过 `$ ccb template -r {template-name} -c {creatorVersion} [-p [platform] = 'web-mobile']` 命令对本地的模板进行设置。

改命令会将 .CocosCreator/packages/build-template/${version} 下原来的 replace 文件夹替换为 replace-n。

通过 `$ ccb rollback {creatorVersion}` 可以将上述操作逆转， 将 replace-max 替换为 replace。

> 注: ccrc.json 文件和 ccrc.js 文件都可以作为配置文件， 但是以 ccrc.json 文件优先。

## plugin

该工具支持插件模式， 和 webpack 类似， 利用了 webpack 的 tapable 实现钩子功能， 支持 4 种钩子:

- Before 在所有编译之前触发
- BeforeEach 在每个平台的编译前触发
- AfterEach 在每个平台的编译后触发
- After 在所有编译后触发

触发顺序为 Before > BeforeEach > AfterEach > After。

那么如何注册插件呢？

通过 builder 的 `register()` 方法可以注册。

该方法接受一个函数作为参数， 函数接收 compiler 对象作为参数， 通过 `compiler.tap(hookName, callback)` 就可以注册一个钩子。

钩子的回调函数 `callback` 只接受一个参数 arr， 通过 plugin 的工具函数 `pluginUtils.parseParams()` 可以将该参数标准化(normalize)为含有以下属性的对象：

- paths: IPath 其中的 `IPath.buildPath` **只在 BeforeEach 和 AfterEach 两个 hook 中可以取到**
- platforms: IPlatform[]
- platform: IPlatform **只在 BeforeEach 和 AfterEach 两个 hook 中可以取到**
- config: 当前游戏所使用的配置信息

```ts
interface IPathSet {
  name: string; // 游戏的路径， 如 /Users/your_name/.../tide-game/src/2019/VII/pick-easter-egg
  template: string; // 使用的模板的路径， 如 /Users/your_name/.../tide-game/templates/template_name
  tempPaths: string[]; // cocos creator 会临时生成的文件（夹）
}

interface IPath extends IPathSet {
  buildPath?: string; // 构建到的最终路径， 如 /Users/your_name/.../tide-game/release/pick-easter-egg
  buildTemplate: string; // 构建使用的模板， path.join(`IPathSet.template`, 'build-templates)`， 如 /Users/your_name/.../tide-game/templates/template_name/build_templates
  tempBuildPath: string; // 构建到的临时路径 如 /Users/your_name/.../tide-game/src/2019/VII/pick-easter-egg/build
}

interface IPlatform {
  buildPath: string; // 不要使用该字段， 使用 `IPath.buildPath`
  platform: EPlatform; // 当前编译的平台
  externalConfig?: boolean | undefined; // 是否使用外部的配置文件
  buildParams: Object; // 配置参数， externalConfig 优先级更高
}

enum EPlatform {
  webMobile = 'web-mobile',
  jsbLink = 'jsb-link',
  jsbDefault = 'jsb-default'
}

export interface IConfig {
  name: string;
  template: string;
  temps: string[];
  platforms: IPlatform[];
  app: string;
}
```

事实上， 整个编译过程中， 对文件的复制、 移动和删除都是利用了该功能。

## 编译到 Vue

只需要在对应平台的路径(如 {template-name}/build-templates/web-mobile)下添加一个 `vue-template.vue` 文件， 就可以启用该功能。 （实际上还需要引入 sfc-plugin.ts 文件， 但是目前默认引入）

该功能有如下特性：

- 添加了 `__cc__require__()` 函数， 该函数会读取指定文件的内容， 并填充到最终的 SFC(Single File Component, 单文件组件) 文件中。
- 修改 `canvas` 的 `id` 相关的属性， 避免多个 `id` 相同造成冲突
  - 会将 `canvas` 的 `id` 属性设置为游戏名
  - 会将 SFC 文件的 `name` 属性设置为游戏名
  - 会将 `__cc__require__()` 函数读取的文件中的 `GameCanvas` 字符串会被修改为游戏名

> 注： 上面提到了会将 `GameCanvas` 字符串修改为游戏名， 所以当该值有变化时， 一定要同时修改 `sfc-plugin` 中对应的值

### sfcPath

通过 ccrc.json 文件中的 `sfcPath` 属性设置最终编译生成的文件的路径。

### `__cc__require()__`

将指定的文件内容读取到 Vue 模板中。

### `context` 参数

当被编译为 vue 组件后， main.js 中的 context 参数是变量 vm 的值， 所以可以将当前 vue 的组件实例对象传入， 通过如下方式：

```js
export default {
  name: '',
  mounted () {
    this.main(this)
  },
  methods: {
    // vm 必须有
    main (vm) {
      // main.js 编译后会需要变量 vm
      __cc__require__('main.js')
    }
  }
}
```

## publicPath

### {{ path }}

将路径添加 publicPath + path

### {{{ path }}}

会将路径添加 publicPath + gameName + path

该功能支持：

- main.js
- \*.html
- \*.css

> 注意
>
> > 对于 html 和 css 等文件来说， 为了方便， 此处路径的替换只是文本字符串匹配后的替换， 某些极端情况会出现错误， 所以建议改为经过 ast 的修改。
> > 对于 main.js 等 js 文件而言， 是在编译后的 js 代码后进行替换的， 所以在某些极端情况下也会有问题。 如果要修改， 可以将 webpack 编译的代码禁用 UglifyJs。 [主要原因是因为 main.js 在生成前， 是通过 webpack 编译的， 而 webpack 已经将代码通过 uglifyJs 处理。 所以想要解决该问题， 就需要将 webpack 的这些功能禁用， 然后再在替换后使用 uglifyJs]

## Cocos 配合 Vue 使用

之前提过， 可以生成 vue 的组件以便在 vue 中使用， 但是整个使用流程有以下注意点:

- 1.添加 vue-template.vue 文件
- 2.在 ccrc.json 中设置 publicPath
- 3.运行 `npm run bulid` 生成 cocos 打包文件和 sfc 文件
- 4.将生成的打包文件和 sfc 文件 copy 到你的项目中
- 5.在你的项目中， 添加上述 publicPath 作为 node 的 static server path， 并指向打包后的文件所在的路径（该路径最好是一个单独的文件夹， 不与其他非 cocos 相关的文件掺杂）
- 6.引入 sfc 文件进行使用（sfc 文件可以在项目的任何位置）

### Cocos 配合 Vue 开发

上述要求可以让你在生产环境中 Vue 和 Cocos 同时运行， 但是无法保证你能将两者结合起来开发， 那么如何保证良好的开发体验的同时， 将两者结合起来进行开发呢？

在使用 Cocos Creator 开发时， 它会帮你起一个服务， 以及完成了开发环境下代码的编译工作。 我们不知道 Creator 完成这些工作的具体细节， 它也没有暴露给我们这样的接口， 所以开发时我们只能将代码编译到 Creator 下， 通过它来伺服。 所以开发时的问题如下：

- 1.将 Vue 的 entry 编译到 Cocos 的项目路径下， 这样作为 Cocos 的脚本后， 就可以通过它进行伺服。 这需要在 Vue 的 webpack 中进行设置。
- 2.指定开发环境下的 template， 否则需要手动替换， 挺麻烦的。 通过 [template 的设置本地的模板](#设置本地的模板) 功能就可以完成
- 3.history2Hash！ 将 history 的单页路由模式， 切换为 hash 模式， 因为只有这样 Cocos 的服务才能正常运行， 并且不需要改动 Vue 的代码

```js
function history2Hash (historyRoutes, basePath) {
  if (!Array.isArray(historyRoutes)) {
    throw new Error('[Error]: routes must be type Array')
  }

  const routes = historyRoutes.map(route => {
    route.path = route.path.replace(basePath, '')
    return route
  })

  return {
    mode: 'hash',
    routes
  }
}

function adjustRoutes (routes, basePath = '/', useHash = process.env.DEV_CC) {
  if (!useHash)
    return { routes, mode: 'history' }
  else
    return history2Hash(routes, basePath)
}
```
