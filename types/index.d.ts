import { IncomingMessage, ServerResponse } from 'http';

export interface PlainObject {
  [key: string]: any;
}

/**
 * simple-mock 配置文件参数定义
 */
export interface SimpleMockConfig {
  /** 是否为静默模式，不打印日志信息。默认 false */
  silent?: boolean;
  /** 打印日志的级别。当 silent 为 false 时有效，默认为 info */
  logLevel?: 'debug' | 'log' | 'info' | 'warning' | 'error';
  /** 打印日志时，是否显示当前时间。默认 true */
  logShowTime?: boolean;
  /** 指定 mock 文件存放的目录，默认为 mock。注意：应当在 .gitignore 文件中忽略该目录 */
  mockFileDir?: string;
  /** 是否开启 Mock API 功能。默认为 false */
  isEnableMock?: boolean;
  /** 是否自动保存远端请求的 API。默认为 true */
  isAutoSaveApi?: boolean;
  /** 是否强制保存，否则本地有时不再保存。默认为 false */
  isForceSaveApi?: boolean;
  /** 自动保存 API 返回内容时，对内容进行过滤，返回 true 则忽略 */
  fnAutosaveFilter?: (content, mockFilePath, req?, res?) => boolean;
  /** 自动保存 API 返回内容时，对内容进行自定义预处理。返回为空则不保存 */
  fnAutosavePerHandler?: (content, mockFilePath, req?, res?) => PlainObject;
  /** 开启 mock 时，过滤一些不需要 mock 的 API */
  disableMockFilter?: (pathname: string, req?: SimpleMockReq, res?) => boolean;
  /** 无论是否开启了 mock，都需要 mock 的 API。renderWs 方法下不适用 */
  enableMockFilter?: (pathname: string, req?: SimpleMockReq, res?) => boolean;
  /** 在 mock 数据返回之前，对 mock 内容进行通用处理 */
  handlerBeforeMockSend?: (content, req: SimpleMockReq | PlainObject, res) => any;
  /** 在 saveApi 中，自定义保存文件的名称 */
  customSaveFileName?: (req: SimpleMockReq | PlainObject, res, filename?: string, type?: 'save' | 'mock') => string;
  /** 当未匹配到 mock 文件时调用，返回通用的 mock 数据 */
  onNotHitMockFile?: (req: SimpleMockReq | PlainObject, res, filename?: string) => any;
}

export interface SimpleMockCfgInner extends SimpleMockConfig {
  /** 用户配置文件最近一次修改的时间。用于识别是否需要更新用户配置。无需配置 */
  _configFileMdDate?: number;
  /** mock 相关文件实际的根目录。无需配置 */
  baseDataPath?: string;
  /** mockData 实际目录。无需配置 */
  mockDataPath?: string;
  /** customData 的实际目录。无需配置 */
  customDataPath?: string;
  /** autoSave 实际目录。无需配置 */
  autoSavePath?: string;
}

export interface SimpleMockReq extends IncomingMessage, PlainObject {
  body?: PlainObject;
  query?: PlainObject;
  params?: PlainObject;
  _parsedUrl?: URL;
}

export interface SimpleMockRes extends ServerResponse, PlainObject {
  req: SimpleMockReq;
  send?: (body: any) => SimpleMockRes;
  status?: (code: number) => SimpleMockRes;
}

export type SimpleMockMethod = (req: SimpleMockReq, res: SimpleMockRes) => any;

/**
 * saveApi 支持的内容格式
 * @var decoded res 参数为已经解码了的内容
 * @var gzip res 使用了 gzip 压缩
 * @var deflate res 使用了采用 zlib 结构和 deflate 压缩算法
 */
export type ContentEncoding = 'decoded' | 'gzip' | 'deflate';
