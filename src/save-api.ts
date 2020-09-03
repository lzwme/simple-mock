const zlib = require('zlib');
const concatStream = require('concat-stream');
import chalk from 'chalk';
import utils from './utils';
import fs from 'fs';
import CONFIG from './config';
import { ContentEncoding } from '../types';

/**
 * 从 Response 流中取得发送的内容（可修改API内容）
 * @param res {Response} The http response
 * @param contentEncoding {string} http header content-encoding: gzip/deflate 或 'decoded'
 * @param callback {Function} 自定义的回调方法，可以用于修改回调内容
 */
export const getBodyFromResponse = (res, contentEncoding: ContentEncoding, callback) => {
  // res 已经是解码的内容了
  if (contentEncoding === 'decoded') {
    if (callback) callback(res);
    return;
  }

  let unzip;
  let zip;

  // 只处理 content-encoding 为 gizp 和 deflate 的
  if (contentEncoding && contentEncoding.includes('gzip')) {
    unzip = zlib.Gunzip();
    zip = zlib.Gzip();
  } else if (contentEncoding === 'deflate') {
    unzip = zlib.Inflate();
    zip = zlib.Deflate();
  } else {
    // try {
    //   if (!res.on || !res.end) return;
    //   const bufs = [];

    //   res.on('data', (data) => bufs.push(data));
    //   res.on('end', () => {
    //     const body = Buffer.concat(bufs).toString();
    //     if (callback) callback(body);
    //     // if (res.end) res.end(body);
    //   });
    // } catch (err) {
    //   CONFIG.log(err);
    // }
    CONFIG.log(chalk.yellowBright('NOT SUPPORTED CONTENT-ENCODING: '), contentEncoding);
    return;
  }

  // 用于在修改内容后回调执行
  const _write = res.write;
  const _end = res.end;

  if (unzip) {
    unzip.on('error', (e) => {
      CONFIG.log('Unzip error: ', e);
      _end.call(res);
    });
  }

  // The rewrite response method is replaced by unzip stream.
  res.write = (data) => {
    unzip.write(data);
  };

  res.end = (data) => {
    unzip.end(data);
  };

  // Concat the unzip stream.
  const concatWrite = concatStream((data) => {
    let body;
    try {
      body = JSON.parse(data.toString());
    } catch (e) {
      body = data.toString();
      CONFIG.info('JSON.parse error:', e);
    }

    // 执行修改请求内容的回调方法
    if (callback) body = callback(body);

    body = new Buffer(JSON.stringify(body));

    // Call the response method and recover the content-encoding.
    zip.on('data', (chunk) => {
      _write.call(res, chunk);
    });
    zip.on('end', () => {
      _end.call(res);
    });

    zip.write(body);
    zip.end();
  });
  unzip.pipe(concatWrite);
};

const onDecodeResponse = (content, absolutePath, req, res) => {
  if (!content) return content;

  try {
    const config = CONFIG.renderConfig(false);
    let contentStr = JSON.stringify(content, null, 2);
    let contentCopy = JSON.parse(contentStr);

    if (typeof config.fnAutosaveFilter === 'function' && !config.fnAutosaveFilter(contentCopy, absolutePath, req, res)) {
      CONFIG.info(chalk.yellow('[saveApi] API 返回内容不符合 config.fnAutosaveFilter 过滤规则，不保存本次获取的内容'), absolutePath);

      return content;
    }

    if (typeof config.fnAutosavePerHandler === 'function') {
      contentCopy = config.fnAutosavePerHandler(contentCopy, absolutePath, req, res);
      if (!contentCopy) return;
      contentStr = JSON.stringify(contentCopy, null, 2);
    }

    if (!contentStr) return;

    CONFIG.info(chalk.bold.yellow('[saveApi] 自动保存内容'), absolutePath);
    fs.writeFileSync(absolutePath, `module.exports = ${contentStr}`);
  } catch (err) {
    CONFIG.log(chalk.red.bold('[saveApi] 尝试写入文件失败!'), chalk.yellow(absolutePath));
    CONFIG.log(err);
  }

  return content;
};

// 保存 API 请求返回的内容到 customdata 目录
export const saveApi = (req, res, contentEncoding: ContentEncoding, filename: string) => {
  const config = CONFIG.renderConfig(false);
  // CONFIG.debug('TRY saveApi...');
  if (!config.isAutoSaveApi || !filename) return;

  const absolutePath = utils.getDataFilePath(filename, 'autosave');

  // 已经存在
  if (utils.isExists(absolutePath)) {
    // 未开启强制保存，或者开启了 mock，则不保存
    if (!config.isForceSaveApi || config.isEnableMock) return;
  }

  if (!contentEncoding && res && res.headers) contentEncoding = res.headers['content-encoding'];

  getBodyFromResponse(res, contentEncoding, (body) => onDecodeResponse(body, absolutePath, req, res));
};
