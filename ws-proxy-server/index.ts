import http, { IncomingMessage } from 'http';
import { Socket } from 'net';
import chalk from 'chalk';
import config from './config';
import utils from './utils';
import { proxy, proxyOnUpgrade } from './ws-proxy';

const log = utils.getLogger();
const proxyServer = http.createServer((req, res) => {
  proxy.web(req, res);
});

proxyServer.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
  proxyOnUpgrade(req, socket, head);
});
proxyServer.on('error', (error) => log.log(chalk.bgRed('PROXY SERVER ERROR:'), error));

proxyServer.listen(config.port, () => {
  log.log(`WS PROXY SERVER LISTEN ON PORT ${chalk.greenBright(config.port.toString())}`);
});
process.title = `WS-PROXY-SERVER - LISTEN ON PORT ${config.port}`;
