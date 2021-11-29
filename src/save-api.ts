import fs from 'fs';
import zlib from 'zlib';
import concatStream from 'concat-stream';
import { color } from 'console-log-colors';
import utils from './utils';
import { CONFIG, logger } from './config';
import { ContentEncoding } from '../types';

const { bold, yellow, red } = color;

/**
 * 从 Response 流中取得发送的内容（可修改API内容）
 * @param res {Response} The http response
 * @param contentEncoding {string} http header content-encoding: gzip/deflate 或 'decoded'
 * @param callback {Function} 自定义的回调方法，可以用于修改回调内容
 */
const getBodyFromResponse = (res, contentEncoding: ContentEncoding, callback) => {
  // res 已经是解码的内容了
  if (contentEncoding === 'decoded' || !res.write) {
    if (!res.write && contentEncoding !== 'decoded') logger.error('error response info:', res);
    if (callback) callback(res);
    return;
  }

  // 用于在修改内容后回调执行
  const _write = res.write;
  const _end = res.end;

  if (!contentEncoding) {
    const chunks = [];

    res.write = (chunk) => {
      _write.call(res, chunk);
      chunks.push(chunk);
    };
    res.end = (data) => {
      if (data) chunks.push(data);
      let body = Buffer.from(chunks.join(''));

      if (callback) {
        try {
          body = JSON.parse(body.toString());
        } catch (e) {
          logger.debug(color.redBright('JSON.parse error:'), e);
        }

        body = callback(body);
        body = Buffer.from(JSON.stringify(body));
      }

      _end.call(res, body);
    };
    return;
  }

  let unzip;
  let zip;

  // 只处理 content-encoding 为 gizp 和 deflate 的
  if (contentEncoding && contentEncoding.includes('gzip')) {
    unzip = zlib.createGunzip();
    zip = zlib.createGzip();
  } else if (contentEncoding === 'deflate') {
    unzip = zlib.createInflate();
    zip = zlib.createDeflate();
  } else {
    logger.log(color.yellowBright('NOT SUPPORTED CONTENT-ENCODING: '), contentEncoding);
    return;
  }

  unzip.on('error', (e) => {
    logger.log('Unzip error: ', e);
    _end.call(res);
  });

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
      logger.info('JSON.parse error:', e);
    }

    // 执行修改请求内容的回调方法
    if (callback) body = callback(body);

    body = Buffer.from(JSON.stringify(body));

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
      logger.info(color.yellow('[saveApi] API 返回内容不符合 config.fnAutosaveFilter 过滤规则，不保存本次获取的内容'), absolutePath);

      return content;
    }

    if (typeof config.fnAutosavePerHandler === 'function') {
      contentCopy = config.fnAutosavePerHandler(contentCopy, absolutePath, req, res);
      if (!contentCopy) return;
      contentStr = JSON.stringify(contentCopy, null, 2);
    }

    if (!contentStr) return;

    logger.info(bold(yellow('[saveApi] 自动保存内容')), absolutePath);
    fs.writeFileSync(absolutePath, `module.exports = ${contentStr}`);
  } catch (err) {
    logger.log(red(bold('[saveApi] 尝试写入文件失败!')), yellow(absolutePath));
    logger.log(err);
  }

  return content;
};

/** 保存 API 返回信息 */
export const saveApi = (req, res, contentEncoding: ContentEncoding, filename = '') => {
  const config = CONFIG.renderConfig(false);
  // logger.debug('TRY saveApi...');
  if (!config.isAutoSaveApi) return;

  filename = utils.getFileName(CONFIG.config, req, res, filename, 'save');

  if (!filename) return;

  const absolutePath = utils.getDataFilePath(filename, 'autosave');

  // 已经存在
  if (utils.isExists(absolutePath)) {
    // 未开启强制保存，或者开启了 mock，则不保存
    if (!config.isForceSaveApi || config.isEnableMock) return;
  }

  if (!contentEncoding && res && res.headers) contentEncoding = res.headers['content-encoding'];

  getBodyFromResponse(res, contentEncoding, (body) => onDecodeResponse(body, absolutePath, req, res));
};
