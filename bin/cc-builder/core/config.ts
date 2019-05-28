import { curDir } from '../utils/index'

export default {
  defaultAppPath: '/Applications/CocosCreator.app/Contents/MacOS/CocosCreator',
  tempBuildPathName: 'build',
  compileFile: 'config.json',
  configFile: 'ccrc.json',
  buildTemplate: 'build-templates',
  defaultTemplatePath: curDir('.template'),
}
