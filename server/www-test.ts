import http from 'http';
import appConfig from './config';
import app from './app';

module.exports = cfg => {
  cfg = Object.assign({}, appConfig, cfg);

  app.set('port', cfg.port);
  const server = http.createServer(app);
  server.listen(cfg.port);
  server.on('error', err => {
    onError(err, cfg.port);
  });
  server.on('listening', () => {
    onListening(server);
  });

  return server;
};

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

function onListening(server) {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

  console.log('Listening on ' + bind);
}
