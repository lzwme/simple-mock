import utils from '../ws-proxy-server/utils';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import chalk from 'chalk';
import WebSocketServer from 'ws/lib/websocket-server';

const wsServer = new WebSocketServer({ noServer: true } as any, () => {});

const proxyOnUpgrade = (server) => {
  server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      ws.on('message', async (data) => {
        try {
          const reqParms = utils.parseData(data);
          console.log(chalk.bgGreen('WS CLIENT REQUEST:'), utils.getSliceData(reqParms));

          const mockData = {
            topic: 'sync_answer',
            reqmsgid: reqParms.reqmsgid,
            data: {
              reqParms,
              now: new Date().toLocaleTimeString(),
            },
          };
          ws.send(JSON.stringify(mockData));
        } catch (err) {
          console.log(chalk.bgRedBright('HANDLEUPGRADE ERROR'), err);
        }
      });
      ws.on('open', () => {
        ws.send('start');
      });
    });
  });
};

module.exports = proxyOnUpgrade;
export default proxyOnUpgrade;
