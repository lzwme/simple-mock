import simpleMock from './simple-mock';
import utils from './utils';
import CONFIG from './config';
import { saveApi } from './save-api';

export * from './save-api';

const mockRender = (req, res, filename: string) => {
  const config = CONFIG.renderConfig();
  const isEnableMock = config.isEnableMock ? !config.disableMockFilter(filename, req, res) : config.enableMockFilter(filename, req, res);

  if (!isEnableMock) return '';

  filename = utils.getFileName(config, req, res, filename, 'mock');
  return filename || '';
};

/** mock http(s) 类型请求初始化 */
export const render = async (req, res, filename = '') => {
  filename = mockRender(req, res, filename);
  if (!filename) return false;

  return await simpleMock.web(req, res, filename);
};
/** mock websocket 类型请求初始化 */
export const renderWs = async (reqData, client, filename = '') => {
  filename = mockRender(reqData, client, filename);
  if (!filename) return false;

  return await simpleMock.ws(reqData, client, filename);
};
/** 保存纯 Data 数据。具体的文件规则需根据 config.customSaveFileName 确定 */
export const saveData = (data, filename = ''): void => {
  return saveApi(data, data, 'decoded', filename);
};
/** 获取当前的 mock 配置 */
export const getConfig = (nocache = true) => {
  return CONFIG.renderConfig(nocache);
};
