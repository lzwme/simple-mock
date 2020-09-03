/**
 * simple-mock 配置信息
 * @see {@link https://github.com/lzwme/simple-mock/blob/master/types/index.d.ts}
 * @see {@link ./node_modules/@lzwme/simple-mock/types/index.d.ts}
 */
// import { SimpleMockConfig } from '@lzwme/simple-mock';
module.exports = {
  mockFileDir: 'mock',
  isEnableMock: false,
  isAutoSaveApi: true,
  isForceSaveApi: false,
  // slient: false,
  // logLevel: 'info',
  // fnAutosaveFilter(content, filePath, req, res) {
  //   // 示例： 不保存 content.data.length = 0 的数据
  //   if (content && Array.isArray(content.data) && !content.data.length) {
  //     return false;
  //   }
  //   // 示例： 不强制保存 errorCode 不为 0 的错误类信息
  //   if (content && +content.errorCode > 0 && this.isForceSaveApi && require('fs').existsSync(filePath)) {
  //     return;
  //   }

  //   return true;
  // },
  // disableMockFilter: (apiPath, req) => {
  //   // 示例：按URL关键字过滤，不 mock 登陆 API
  //   // const filterKeyList = ['/rest/auth'];
  //   // const find = filterKeyList.find(path => String(apiPath).includes(path));
  //   // if (find) return true;
  //   return false;
  // },
  // enableMockFilter: (apiPath, req) => {
  //   // 示例：按URL关键字过滤
  //   // const filterKeyList = ['test'];
  //   // const find = filterKeyList.find(path => String(apiPath).includes(path));
  //   // if (find) return true;
  //   return false;
  // },
  // customSaveFileName: (req, res, filename, type) => filename,
  // handlerBeforeMockSend: (content, req, res) => content,
  // fnAutosavePerHandler: (content, mockFilePath, req, res) => content,
  // } as SimpleMockConfig;
};
