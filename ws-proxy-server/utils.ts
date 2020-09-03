/* eslint-disable no-console */
import config from './config';

const utils = {
  getLogger() {
    const log = {
      debug: (...args) => {
        if (!config || !config.debug) return;
        console.log(...args);
      },
      info: (...args) => {
        if (config && config.silent) return;
        console.log(...args);
      },
      log: (...args) => {
        console.log(...args);
      },
    };
    return log;
  },
  parseData(data) {
    if (data instanceof Buffer) data = data.toString();
    if (typeof data !== 'string') return data;

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  },
  /**
   * 默认的 mock 本地保存文件名生成规则。
   * 功能同 config.customSaveFileName，但执行更早
   */
  customSaveFileName: (params, client, filename, type: 'save' | 'mock') => {
    if (filename) return filename;
    if (!params) return;

    if (params.topic) filename = params.topic;
    if (params.funcid) filename = params.funcid;
    if (!filename) filename = 'rest_user_666';

    return filename;
  },
  /**
   * mock 发送前的默认通用内容处理
   * reqmsgid 为每次请求与应答对应关系的唯一标识
   * 功能同 config.handlerBeforeMockSend，但执行更晚
   */
  handlerBeforeMockSend: (content, req, params) => {
    let reqmsgid;

    // 将 mock 内容中的 reqmsgid 替换为 req 请求参数中的 reqmsgid
    const findReqmsgid = (obj, isReplace) => {
      if (obj.reqmsgid) {
        if (isReplace && reqmsgid) obj.reqmsgid = reqmsgid;
        else reqmsgid = obj.reqmsgid;
        return;
      }

      if (obj.data) findReqmsgid(obj.data, isReplace);
    };
    findReqmsgid(params, false);
    findReqmsgid(content, true);

    // console.log('\n\n reqmsgid', reqmsgid);

    return content;
  },
  /** 获取截断 data.data 长度为 maxLen 的复制数据。主要为了避免大量数据的日志打印 */
  getSliceData(data, maxLen = 0) {
    data = utils.parseData(data);

    if (data && data.data) {
      const copyData = Object.assign({}, data);
      if (typeof data.data !== 'string') copyData.data = JSON.stringify(copyData.data);

      maxLen = maxLen || config.logDataMaxLen;
      if (copyData.data.length > maxLen) copyData.data = copyData.data.slice(0, maxLen) + '...';
      return copyData;
    }

    return data;
  },
};

export default utils;
