/**
 * 接口代理配置与mock
 */

import chalk from 'chalk';
import queryString from 'querystring';
import httpProxy from 'http-proxy';
import appConfig from './config';
const apiProxy = httpProxy.createProxyServer();
import * as apiMock from '../src';

const proxyTarget = `http://localhost:${appConfig.port}/proxy/`;

export const fnProxy = (conf) => {
  const { app } = conf;

  console.log('current proxyTarget: ', proxyTarget);

  // 需要代理的路由规则
  appConfig.API_PROXY_CONFIG.forEach((urlReg) => {
    app.all(urlReg, async (req, res) => {
      if (appConfig.isDev && (await apiMock.render(req, res))) {
        return;
      }

      console.log(chalk.cyan('[apiProxy]'), req._parsedUrl.pathname, '\t', chalk.yellow(urlReg));
      apiProxy.web(req, res, {
        target: proxyTarget,
        selfHandleResponse: true,
      });
    });
  });

  apiProxy.on('proxyRes', (proxyRes, req, res) => {
    // 针对 content-encoding 为 gzip/deflate 压缩的情况，其他其他格式请自行解码返回内容
    const encoding = proxyRes.headers['content-encoding'];

    if (['gzip', '‘deflate'].includes(encoding)) {
      apiMock.saveApi(req, res, encoding);
    } else {
      const bufs = [];

      proxyRes.on('data', (data) => bufs.push(data));
      proxyRes.on('end', () => {
        let body = Buffer.concat(bufs).toString();
        res.end();

        try {
          body = JSON.parse(body);
        } catch (err) {}
        console.log(chalk.bgBlueBright('PROXYRES CONTENT: '), body);
        apiMock.saveApi(req, body, 'decoded');
      });
    }
  });

  apiProxy.on('proxyReq', (proxyReq, req, res, options) => {
    // 针对 post 请求，将 bodyParser 消费过的 stream 重新写回到 req
    if (!req.body || !Object.keys(req.body).length) {
      return;
    }

    const contentType = proxyReq.getHeader('Content-Type');
    let bodyData;

    // console.log('contentType=', contentType);

    if (contentType === 'application/json') {
      bodyData = JSON.stringify(req.body);
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      bodyData = queryString.stringify(req.body);
    }

    if (bodyData) {
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  });
};
