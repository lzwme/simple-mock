import proxyOnUpgrade from './ws';
import http from 'http';
import chalk from 'chalk';
import appConfig from './config';
const app = require('./app');
app.set('port', appConfig.port);

const server = http.createServer(app);
proxyOnUpgrade(server);

server.listen(appConfig.port);
server.on('error', (err) => {
  onError(err, appConfig.port);
});

server.on('listening', onListening);
process.title = `HTTP SERVER LISTENING ON PORT ${appConfig.port}`;

/**
 * 错误处理
 */
function onError(error, port) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening() {
  // const addr = server.address();
  // console.log(addr);
  // const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log('HTTP SERVER LISTENING ON', chalk.yellowBright(appConfig.port));

  if (process.argv.includes('-o') || process.argv.includes('--open')) {
    const cmd = process.platform === 'win32' ? 'start' : 'open';
    require('child_process').exec(`${cmd} http://localhost:${appConfig.port}`);
  }
}

export default server;
