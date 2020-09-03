import utils from './utils';
import chalk from 'chalk';
import CONFIG from './config';
import fs from 'fs';

const mockFileMTimes: any = {};

/**
 * 尝试根据 req 请求 pathname 获取指定类型的 mock 文件内容
 * @param {string} type 取值为 autosave、customdata 或 mockdata
 */
function tryGetContentInfo(filename, type) {
  let absolutePath = utils.getDataFilePath(filename, type);

  if (!utils.isExists(absolutePath)) {
    // 看看是否存在 ts 结尾的文件
    absolutePath = absolutePath.replace(/\.js$/, '.ts');
    if (!utils.isExists(absolutePath)) return false;

    const tsNode = require('ts-node');
    if (!process[tsNode.REGISTER_INSTANCE]) {
      tsNode.register(CONFIG.tsNodeOptions);
      CONFIG.debug('Load ts-node for api mock file');
    }
  }

  try {
    const mtimeMs = fs.statSync(absolutePath).mtimeMs;
    if (!mockFileMTimes[absolutePath]) mockFileMTimes[absolutePath] = mtimeMs;
    if (require.cache[absolutePath] && mtimeMs !== mockFileMTimes[absolutePath]) {
      mockFileMTimes[absolutePath] = mtimeMs;
      delete require.cache[absolutePath];
    }

    const content: any = require(absolutePath);

    return { content, absolutePath };
  } catch (err) {
    CONFIG.error(chalk.bold.red('[TRY MOCK ERROR]: '), filename, err);
    return false;
  }
}

async function getContent(req, res, filename) {
  // 自定义目录优先
  let contentInfo = tryGetContentInfo(filename, 'customdata');
  const config = CONFIG.renderConfig(false);

  // 自定义不存在，看公共定义
  if (!contentInfo) {
    contentInfo = tryGetContentInfo(filename, 'mockdata');
  }

  // 公共定义也没有，看看自动保存的内容
  if (!contentInfo) {
    contentInfo = tryGetContentInfo(filename, 'autosave');
  }

  if (!contentInfo && config.onNotHitMockFile) {
    const content = config.onNotHitMockFile(req, res, filename);

    if (content) {
      contentInfo = {
        content,
        absolutePath: 'university mock by config.onNotHitMockFile',
      };
    } else {
      CONFIG.warn(chalk.red('FILE NOT EXISTS: '), filename);
    }
  }

  if (contentInfo) {
    // 支持返回为方法
    if (typeof contentInfo.content === 'function') {
      contentInfo.content = await contentInfo.content(req, res);
      if (typeof res.set === 'function') res.set('X-Powered-By', 'simplemock-custom');
    }

    if ('function' === typeof config.handlerBeforeMockSend) {
      contentInfo.content = config.handlerBeforeMockSend(contentInfo.content, req, res);
    }

    // 取消 mock 的情况
    if ([void 0, null, '__ignore_mock__'].includes(contentInfo.content)) {
      CONFIG.warn(chalk.blue('[IGNORE MOCK]'), filename);
      return false;
    }
  }

  return contentInfo;
}

const mock = {
  /**
   * 最普通的 mock 规则：读取 customdata 或 mockdata 目录下的文件，如符合则返回 mock 数据
   * @param {Request} req http request
   * @param {Response} res http response
   * @param {string} filename 针对本次请求的本地 mock 文件名
   */
  async web(req, res, filename: string) {
    // CONFIG.debug('simplemock fro http');
    const contentInfo = await getContent(req, res, filename);
    if (!contentInfo) return false;

    const { absolutePath, content } = contentInfo;

    CONFIG.info(chalk.green('[mockAPI]'), (req && req.url) || '', chalk.yellow(absolutePath));

    if (req && req.url && res) {
      // 在 mock 规则文件内已经在 content 方法中处理了（已执行了 res.send），则返回 true
      if (req && res.headersSent) {
        CONFIG.info(chalk.green('[mockAPI] CUSTOM SENDED FOR'), req.url, absolutePath);
        return true;
      }

      if ('function' === typeof res.set) res.set('X-Powered-By', 'simplemock');
      if ('function' === typeof res.status) res.status(200).json(content);
      if ('function' === typeof res.end) res.end();
    }

    return content;
  },

  /**
   * 针对 websocket 类型数据请求的 mock
   * @param {Object} reqData ws 客户端发送的请求数据
   * @param {*} client 客户端 ws 句柄或其他信息，自定义mock文件为函数时传入为第二个参数
   * @param {string} filename 针对本次 reqData 请求的本地 mock 文件名
   */
  async ws(reqData, client, filename: string) {
    // CONFIG.debug('simplemockWs');
    const contentInfo = await getContent(reqData, client, filename);
    if (!contentInfo) return false;

    const { absolutePath, content } = contentInfo;

    CONFIG.info(chalk.green('[mockAPI]'), chalk.yellow(absolutePath));

    return content;
  },
};

export default mock;
