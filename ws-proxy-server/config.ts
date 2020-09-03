const env = process.env;
const config = {
  binaryType: null, // 'arraybuffer',
  port: +env.DEV_WS_SERVER_PORT || 2222,
  /** 是否开启 debug 模式 */
  debug: env.DEV_WS_SERVER_DEBUG !== '1',
  /** 是否为静默模式 */
  silent: env.DEV_WS_SERVER_SILENT === '1',
  /** trade 服务端代理地址 */
  tradeProxyTarget: env.DEV_PROXY_URL || 'ws://localhost:2221',
  /** 日志输出时，data 内容的最大长度。超过则截断，避免输出过多信息造成干扰 */
  logDataMaxLen: +env.DEV_WS_SERVER_LOG_DATA_MAX_LEN || 300,
  /** mock 信息时，是否使用广播模式发送信息 */
  isBroadcast: env.DEV_WS_SERVER_IS_BROADCAST !== '0',
  /** 是否使用 ws/receiver 解码请求信息。暂勿开启，当前启用会导致客户端连接后即关闭 */
  useWsReceiver: false,
  /** 手动 mock 客户端 Server 相关配置信息 */
  mockClient: {
    port: +env.DEV_WS_MOCK_CLIENT_PORT || 2223,
    /** 是否自动打开客户端站点页面 */
    isOpenPage: env.DEV_WS_MOCK_CLIENT_OPEN_PAGE !== '0',
  },
};

export default config;
