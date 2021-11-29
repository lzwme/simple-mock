/*
 * @Description: 实现 trade_url websocket 请求代理与 mock 功能
 */

import { ClientRequest, IncomingMessage } from 'http';
import WebSocketServer from 'ws/lib/websocket-server';
import Receiver from 'ws/lib/receiver';
import Extensions from 'ws/lib/extension';
import PerMessageDeflate from 'ws/lib/permessage-deflate';
import { Socket } from 'net';
import httpProxy from 'http-proxy';
import { color } from 'console-log-colors';
import config from './config';
import utils from './utils';
import { getDecodedData } from './decode-data';
import mockClient from './mock-client';

// import simpleMock from '@lzwme/simple-mock';
const simpleMock = require('../dist');
const log = utils.getLogger();

export const proxy = httpProxy.createProxyServer({
  target: config.tradeProxyTarget,
  ws: true,
  selfHandleResponse: true,
});
const wsServer = new WebSocketServer({ noServer: true } as any, () => {});
/** 广播消息 */
const wsMockbroadcast = (data) => {
  wsServer.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  });
};

/** 解码 websocket upgrade 请求信息 */
const receiverWsReq = (req, socket: Socket, head) => {
  if (!config.useWsReceiver) {
    socket.on('data', (data) => {
      log.info(color.bgGreen('CLIENT REQUEST'), '...'); // , data.toString().slice(0, 50));
    });
    return;
  }

  const extensions = {};
  const perMessageDeflate = new PerMessageDeflate(null, true, 0);
  const serverExtensions = Extensions.parse(req.headers['sec-websocket-extensions']);

  perMessageDeflate.accept(serverExtensions[PerMessageDeflate.extensionName]);
  extensions[PerMessageDeflate.extensionName] = perMessageDeflate;

  const receiver: any = new Receiver(config.binaryType, extensions, true, 0);

  socket.on('data', (data: Buffer) => {
    receiver.write(data, null, (err) => {
      if (err) log.debug(color.bgGreen('RECEIVER ERR'), err);
    });
  });
  socket.on('close', () => {
    log.log('CLIENT SOCKET CLOSED');
    receiver.removeAllListeners();
    receiver.end();
  });

  receiver.on('message', (data) => {
    const result = data instanceof ArrayBuffer ? getDecodedData(data) : utils.parseData(data);
    log.info(color.bgGreen('CLIENT REQUEST:'), utils.getSliceData(result));
  });
};

export const proxyOnUpgrade = (req: IncomingMessage, socket: Socket, head: Buffer) => {
  const mockCfg = simpleMock.getConfig();

  if (!mockCfg.isEnableMock) {
    proxy.ws(req, socket, head);
    receiverWsReq(req, socket, head);

    return;
  }

  if (!mockClient.wsClientServer) mockClient.createClientServer(wsServer);

  wsServer.handleUpgrade(req, socket, head, (ws) => {
    ws.on('message', async (data) => {
      try {
        const reqParms = utils.parseData(data);
        log.info(color.bgGreen('WS REQUEST:'), utils.getSliceData(reqParms));

        const filename = utils.customSaveFileName(reqParms, null, null, 'mock');
        let mockData = await simpleMock.renderWs(
          reqParms,
          {
            send: (d) => ws.send(d),
            broadcast: (d) => wsMockbroadcast(d),
          },
          filename
        );

        if (mockData) {
          mockData = utils.handlerBeforeMockSend(mockData, null, reqParms);
          log.info(color.bgBlue('WS MOCK RESPONSE'), utils.getSliceData(mockData));

          if (config.isBroadcast) {
            wsMockbroadcast(mockData);
          } else {
            ws.send(JSON.stringify(mockData));
          }
        }
      } catch (err) {
        log.log(color.bgRedBright('handleUpgrade error'), err);
      }
    });
    ws.on('close', () => {
      mockClient.onProxyWsChange();
    });
    mockClient.onProxyWsChange();
  });
};

proxy.on('proxyReqWs', (proxyReq: ClientRequest, req: IncomingMessage, socket: Socket, options, head: Buffer) => {
  proxyReq.on('upgrade', (proxyRes: IncomingMessage, proxySocket: Socket, proxyHead: Buffer) => {
    log.info(color.bgMagenta('\n PROXY ON: '), proxySocket.remoteAddress + ':' + proxySocket.remotePort);

    const extensions = {};
    const perMessageDeflate = new PerMessageDeflate({ threshold: 10240 } as any, false, 0);
    // const perMessageDeflate = new PerMessageDeflate({ threshold: 10240, clientMaxWindowBits: 10240 } as any, false, 0);
    // const secWebsocketExtensions = req.headers['sec-websocket-extensions'] || 'permessage-deflate; client_max_window_bits';
    // const serverExtensions = Extensions.parse(secWebsocketExtensions);
    // perMessageDeflate.accept(serverExtensions[PerMessageDeflate.extensionName]);
    extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
    const receiver: any = new Receiver(config.binaryType, extensions, false, 0);

    proxySocket.on('data', (data: Buffer) => {
      receiver._write(data, null, (err) => {
        if (err) log.debug(err);
      });
    });
    proxySocket.on('close', () => {
      receiver.removeAllListeners();
      receiver.end();
    });

    receiver.on('message', (data) => {
      try {
        const result = data instanceof ArrayBuffer ? getDecodedData(data) : utils.parseData(data);
        log.info(color.bgBlue('WS PROXY RESPONSE'), utils.getSliceData(result));
        if (result.data) result.data = utils.parseData(result.data);
        // 默认的文件名
        const filename = utils.customSaveFileName(result, null, null, 'mock');
        // 自动保存 API 返回内容
        simpleMock.saveData(result, filename);
      } catch (err) {
        log.debug(color.bgRedBright('WS PROXY RESPONSE'), data);
        log.log('parse err:', err);
      }
    });
  });
});
// proxy.on('proxyRes', (proxyRes, req, res) => log.info('proxyRes', JSON.stringify(proxyRes.headers, null, 2));
// proxy.on('proxyReq', (proxyReq, req, res) => log.info('proxyReq', proxyReq.headers));
proxy.on('close', (res, socket, head) => log.info('WS CLIENT DISCONNECTED'));
