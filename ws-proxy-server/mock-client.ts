/**
 * 用于手动发送 mock 消息的客户端服务
 */

import url from 'url';
import http from 'http';
import { color } from 'console-log-colors';
import fs from 'fs';
import path from 'path';
import WebSocketServer from 'ws/lib/websocket-server';
import config from './config';
import utils from './utils';
import { exec } from 'child_process';
const log = utils.getLogger();

class MockClient {
  /** 客户端 ws 代理 Server */
  public proxyWsServer: WebSocketServer;
  /** mock client Server */
  public wsClientServer: WebSocketServer;
  /** 当代理 ws 连接状态改变时(open、close)，向客户端发送当前 ws 连接数 */
  onProxyWsChange() {
    if (!this.proxyWsServer) return;
    let size = 0;
    this.proxyWsServer.clients.forEach((ws) => ws.readyState === ws.OPEN && size++);
    log.info('当前客户端 ws 代理连接数：', size);

    this.wsClientServer.clients.forEach((ws) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'ws-size', data: size }));
      }
    });
  }
  createClientServer(proxyWsServer: WebSocketServer) {
    this.proxyWsServer = proxyWsServer;

    const clientServer = http.createServer((req, res) => {
      const reqUrl = url.parse(req.url);
      if (reqUrl.pathname === '/ws') return;

      if (reqUrl.pathname.endsWith('.js')) {
        res.writeHead(200, { 'Content-Type': 'application/x-javascript' });
      } else if (reqUrl.pathname.endsWith('.json')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
      } else if (/\.png|jpg$/.test(reqUrl.pathname)) {
        res.writeHead(200, { 'Content-Type': 'image/*' });
      } else if (reqUrl.pathname.endsWith('.css')) {
        res.writeHead(200, { 'Content-Type': 'text/css' });
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
      }

      const baseDir = path.resolve(__dirname, './client-assets');
      let filePath = path.join(baseDir, reqUrl.pathname);

      if (!reqUrl.pathname.includes('.')) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath)) {
        res.end(fs.readFileSync(filePath));
      } else {
        // res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(path.resolve(baseDir, 'index.html')));
      }
    });

    const wsClientServer = new WebSocketServer({ path: '/ws', server: clientServer } as any, (err) => {});

    (wsClientServer as any).on('connection', (client) => {
      client.on('message', (message: string) => {
        log.info('CLIENT MOCK RECEIVED: ', message);
        const data = utils.parseData(message);

        // const info =  JSON.parse(message);
        if (message === 'get-size') {
          this.onProxyWsChange();
          return;
        }

        if (data && data.type === 'mock') {
          if (typeof data.data !== 'string') data.data = JSON.stringify(data.data);

          log.log(color.bgBlueBright('TRY SEND CLIENT MOCK MSG:'), utils.getSliceData(data.data));
          this.proxyWsServer.clients.forEach((proxyClient) => {
            if (proxyClient.readyState === proxyClient.OPEN) {
              proxyClient.send(data.data);
            }
          });
        }

        client.send('ok');
      });

      client.send(JSON.stringify({ msg: 'connectioned' }));
      setTimeout(() => {
        this.onProxyWsChange();
      }, 1000);
    });

    const port = config.mockClient.port;
    clientServer.listen(port, () => {
      log.log('MOCK CLIENT SERVER LISTEN ON', color.greenBright(port));

      if (config.mockClient.isOpenPage) {
        try {
          exec(`${process.platform === 'win32' ? 'start' : 'open'} http://localhost:${port}`);
        } catch {
          log.log('尝试打开客户端页面失败');
        }
      }
    });

    this.wsClientServer = wsClientServer;

    return { wsClientServer, clientServer };
  }
}

export default new MockClient();
