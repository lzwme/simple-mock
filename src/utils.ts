import { SimpleMockCfgInner } from '../types';

import fs from 'fs';
import path from 'path';
import { CONFIG } from './config';

const utils = {
  /** 取得mock文件的路径 */
  getDataFilePath: (pathname: string, type: 'autosave' | 'customdata' | 'mockdata' = 'mockdata') => {
    const config: SimpleMockCfgInner = CONFIG.renderConfig(false);
    let realDir: string;

    if (type === 'autosave') {
      realDir = config.autoSavePath;
    } else if (type === 'customdata') {
      realDir = config.customDataPath;
    } else {
      realDir = config.mockDataPath;
    }

    if (pathname) {
      pathname = pathname.replace(/\//g, '_').replace(/^_/, '') + '.js';
    } else {
      pathname = '';
    }

    return path.resolve(realDir, pathname);
  },
  /** 判断指定到文件是否存在 */
  isExists: (filePath: string) => {
    return fs.existsSync(filePath);
  },
  /** 是否支持 typescript */
  isSupportTs: () => {
    try {
      require('typescript');
      require('ts-node');
      // console.log('支持 typescript');
      return true;
    } catch {
      return false;
    }
  },
  isNull: (value) => {
    return value === null || value === undefined;
  },
  /** 数据保存文件名称 */
  getFileName: (config: SimpleMockCfgInner, req, res, filename: string, type: 'save' | 'mock') => {
    if (config.customSaveFileName) {
      filename = config.customSaveFileName(req, res, filename, type);
    }

    if (!filename && req) {
      if (!filename) filename = req._parsedUrl ? req._parsedUrl.pathname : req.pathname;
      if (!filename) filename = String(req.url || '').split('?')[0];
    }

    if (filename) filename = filename.replace(/\//g, '_').replace(/^_/, '');

    return filename;
  },
  clearRequireCache(filePath: string) {
    filePath = require.resolve(filePath);

    const cacheInfo = require.cache[filePath];
    if (!cacheInfo) return;

    if (cacheInfo.parent) {
      let i = cacheInfo.parent.children.length;
      while (i--) {
        if (cacheInfo.parent.children[i].id === filePath) {
          cacheInfo.parent.children.splice(i, 1);
        }
      }
    }

    const children = cacheInfo.children.map((d) => d.id);
    delete require.cache[filePath];
    children.forEach((id) => utils.clearRequireCache(id));
  },
};

export default utils;
