import simpleMock from './simple-mock';
import { saveApi } from './save-api';
import utils from './utils';
import CONFIG from './config';
import { ContentEncoding } from '../types';

const mockRender = (req, res, filename: string) => {
  const config = CONFIG.renderConfig();
  const isEnableMock = config.isEnableMock ? !config.disableMockFilter(filename, req, res) : config.enableMockFilter(filename, req, res);

  if (!isEnableMock) return '';

  filename = utils.getFileName(config, req, res, filename, 'mock');
  return filename || '';
};

const SIMPLEMOCK = {
  render: async (req, res, filename = '') => {
    filename = mockRender(req, res, filename);
    if (!filename) return false;

    return await simpleMock.web(req, res, filename);
  },
  /** mock websocket 类型请求 */
  renderWs: async (reqData, client, filename = '') => {
    filename = mockRender(reqData, client, filename);
    if (!filename) return false;

    return await simpleMock.ws(reqData, client, filename);
  },
  /** 保存 API 返回信息 */
  saveApi: (req, res, contentEncoding: ContentEncoding, filename = '') => {
    if (!CONFIG.config) CONFIG.renderConfig();
    if (!CONFIG.config.isAutoSaveApi) return;
    filename = utils.getFileName(CONFIG.config, req, res, filename, 'save');

    if (!filename) return;

    return saveApi(req, res, contentEncoding, filename);
  },
  /** 保存纯 Data 数据。具体的文件规则需根据 config.customSaveFileName 确定 */
  saveData: (data, filename = ''): void => {
    return SIMPLEMOCK.saveApi(data, data, 'decoded', filename);
  },
  getConfig: (nocache = true) => {
    return CONFIG.renderConfig(nocache);
  },
};

export default SIMPLEMOCK;
module.exports = SIMPLEMOCK;
