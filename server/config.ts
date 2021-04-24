/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';

const appConfig = {
  port: normalizePort(process.env.SERVER_PORT) || 2221,
  API_PROXY_CONFIG: ['/rest/**', '/admin/rest/**', '/abc/rest/**'],
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
};

export default appConfig;
