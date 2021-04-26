import { SimpleMockConfig, SimpleMockCfgInner } from '../types';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import utilDir from './utils-dir';
const cwd = process.env.PROJECT_CWD || process.cwd();
const defaultCfg: SimpleMockCfgInner = {
  slient: false,
  logLevel: 'info',
  mockFileDir: 'mock',
  isEnableMock: false,
  isAutoSaveApi: true,
  isForceSaveApi: false,
  // fnAutosaveFilter: () => true,
  disableMockFilter: () => false,
  enableMockFilter: () => false,
  _configFileMdDate: 0,
};
const tsNodeOptions = {
  skipProject: true,
  transpileOnly: true,
  typeCheck: false,
  files: false,
  compilerOptions: {
    module: 'commonjs',
    target: 'esnext',
    allowJs: false,
    noEmitHelpers: true,
    disableSizeLimit: true,
    skipLibCheck: true,
    sourceMap: false,
    inlineSourceMap: false,
    inlineSources: true,
    declaration: false,
    noEmit: false,
  },
};

/**
 * 从配置文件中读取 config 配置，如配置文件不存在，则创建它
 */
const getConfigFromFile = () => {
  // cwd 目录不存在配置文件，则写入它
  let cfgFile = path.resolve(cwd, 'simple-mock-config.js');
  const cfgExampleFile = path.resolve(__dirname, '../simple-mock-config-example.js');
  const cfgTsFile = cfgFile.replace(/\.js$/, '.ts');

  // if (fs.existsSync(cfgTsFile) || (!fs.existsSync(cfgFile) && utils.isSupportTs())) {
  if (fs.existsSync(cfgTsFile)) {
    cfgFile = cfgTsFile;
  }

  if (!fs.existsSync(cfgFile)) {
    CONFIG.info(chalk.green.bold(`\n[INFO] 尝试创建[simple-mock]配置文件：`), chalk.yellow.bold(cfgFile));
    let cfgExampleContent = fs.readFileSync(cfgExampleFile, { encoding: 'utf8' });

    if (cfgFile.endsWith('.ts') && fs.existsSync(path.resolve(__dirname, '../package.json'))) {
      const pkg = require('../package.json');
      cfgExampleContent = cfgExampleContent
        .trim()
        .replace('module.exports = {', `import { SimpleMockConfig } from '${pkg.name}';\n\nmodule.exports = {`)
        .replace(/};$/, `} as SimpleMockConfig;`);
    }
    fs.writeFileSync(cfgFile, cfgExampleContent);
    defaultCfg._configFileMdDate = 0;

    // 将 simple-mock-config.* 加入 git 忽略
    const gitignoreFile = path.resolve(cwd, '.gitignore');
    if (fs.existsSync(gitignoreFile)) {
      const gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8') + '';
      if (!gitignoreContent.includes('simple-mock-config.*')) {
        CONFIG.info(chalk.yellow.bold('[INFO] 将 simple-mock 配置文件规则写入到 .gitignore'));
        fs.appendFileSync(gitignoreFile, '\nsimple-mock-config.*', 'utf-8');
      }
    }
  }

  let config: SimpleMockCfgInner;
  try {
    const cfgFileStat = fs.statSync(cfgFile);

    if (defaultCfg._configFileMdDate && defaultCfg._configFileMdDate !== cfgFileStat.mtimeMs) {
      CONFIG.info(chalk.green.bold(`\n[INFO] 检测到[simple-mock]配置文件有更新：`), chalk.yellow.bold(cfgFile));
      delete require.cache[cfgFile];
      CONFIG.config = null;
    }
    defaultCfg._configFileMdDate = cfgFileStat.mtimeMs;

    if (cfgFile.endsWith('.ts')) {
      const tsNode = require('ts-node');
      if (!process[tsNode.REGISTER_INSTANCE]) {
        tsNode.register(CONFIG.tsNodeOptions);
        CONFIG.info('Load ts-node for config file');
      }
    }

    config = require(cfgFile);
  } catch (err) {
    CONFIG.log(chalk.yellow('[WARNING] Not find config file of simple-mock-config.js: '), cfgFile, err);
  }

  config = Object.assign({}, defaultCfg, config);

  ['disableMockFilter', 'enableMockFilter'].forEach((key) => {
    if (typeof config[key] !== 'function') {
      config[key] = defaultCfg[key];
    }
  });

  return config;
};

/**
 * 从环境变量中读取 config 配置
 */
const getConfigFromEnv = (config: SimpleMockCfgInner) => {
  let envVals;

  config = config || {};

  // 是否开启 Mock API 功能
  envVals = (process.env.MOCKAPI_ENABLE || '').trim();
  if (envVals) {
    config.isEnableMock = envVals === 'mock'; // && (process.env.NODE_ENV + '').includes('dev');
  }

  // 是否自动保存远端请求的 API
  envVals = (process.env.MOCKAPI_AUTOSAVE || '').trim();
  if (envVals) {
    config.isAutoSaveApi = envVals === 'save';
  }

  // 是否强制保存，否则本地有时不再保存。isEnableMock 为 false 时有效
  envVals = (process.env.MOCKAPI_AUTOSAVE_FORCE || '').trim();
  if (envVals) {
    config.isForceSaveApi = envVals === 'force';
  }

  return config;
};

/**
 * 获取或创建各种 mock 目录
 */
const getOrCreateDirs = (config: SimpleMockCfgInner) => {
  const baseDataPath = path.resolve(cwd, config.mockFileDir || 'mock');
  const mockDataPath = path.resolve(baseDataPath, 'mockdata');
  const customDataPath = path.resolve(baseDataPath, 'customdata');
  const autoSavePath = path.resolve(customDataPath, 'autosave');

  // 创建目录
  if (!fs.existsSync(mockDataPath) || !fs.statSync(mockDataPath).isDirectory()) {
    utilDir.mkDir(mockDataPath);
  }

  if (!fs.existsSync(customDataPath) || !fs.statSync(customDataPath).isDirectory()) {
    utilDir.mkDir(customDataPath);
  }

  if (!fs.existsSync(autoSavePath) || !fs.statSync(autoSavePath).isDirectory()) {
    utilDir.mkDir(autoSavePath);
  }

  // config.mockFileDir 目录下应存在 .gitignore 文件
  const gitignoreFile = path.resolve(baseDataPath, '.gitignore');

  if (!fs.existsSync(gitignoreFile)) {
    fs.writeFileSync(gitignoreFile, 'customdata/**', { encoding: 'utf8' });
  }

  Object.assign(config, {
    baseDataPath,
    mockDataPath,
    customDataPath,
    autoSavePath,
  });

  return config;
};

const logLevelList = { debug: 1, info: 2, warning: 3, error: 4 };
const bgType = { debug: 'greenBright', info: 'bgCyan', warning: 'bgYellowBright', error: 'bgRed' };

const log = (level: keyof typeof logLevelList, ...args) => {
  const config = CONFIG.config || defaultCfg;
  if (!logLevelList[level]) level = 'info';
  if (config.slient || logLevelList[config.logLevel] > logLevelList[level]) return;

  const tip = chalk.white[bgType[level]](`${level}`.toUpperCase());
  console.log(tip, ...args);
};

// 导出配置
const CONFIG = {
  config: null as SimpleMockConfig, // this.renderConfig(),
  renderConfig: (nocache = true) => {
    if (!nocache && CONFIG.config) return CONFIG.config;

    let config = getConfigFromFile();
    config = getConfigFromEnv(config);
    config = getOrCreateDirs(config);

    if (!CONFIG.config) {
      CONFIG.info(
        chalk.green(`\n[SIMPLE-MOCK]`),
        chalk.cyan(`isEnableMock=${config.isEnableMock}, isAutoSaveApi=${config.isAutoSaveApi}, isForceSaveApi=${config.isForceSaveApi}`)
      );
    }

    CONFIG.config = config;

    return config as SimpleMockConfig;
  },
  tsNodeOptions,
  /** log.info */
  info: (...args) => {
    log('info', ...args);
  },
  warn: (...args) => {
    log('warning', ...args);
  },
  error: (...args) => {
    log('error', ...args);
  },
  /** 只有 logLevel=debug 时才打印 */
  debug: (...args) => {
    log('debug', ...args);
  },
  log: (...args) => {
    console.log(...args);
  },
};

module.exports = CONFIG;
export default CONFIG;
