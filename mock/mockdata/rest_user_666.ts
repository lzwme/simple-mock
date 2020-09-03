import { SimpleMockMethod } from '../../index.d';
import chalk from 'chalk';

const fn: SimpleMockMethod = (req, res) => {
  const result = {
    code: 200,
    url: req.url || '',
    data: {
      name: 'lzw',
      webSite: 'https://lzw.me',
    },
    date: new Date().toLocaleString(),
    reqInfo: {
      query: req.query,
      body: req.body,
    } as any,
  };

  // for ws
  if (res.broadcast) {
    console.log(chalk.bgGreen('mock for websocket: '), req);
    result.reqInfo = req;
    return Object.assign(
      {
        data: result,
      },
      req
    );
  }

  console.log(chalk.bgGreen('HTTP 请求参数: '), req.body, req.query);
  // console.log(req.ip, req.ips, req.originalUrl);
  // 你甚至可以直接发送各种状态来返回结果(这里 server 以 express 为例)
  // res.status(500).send({ error: 'something blew up' });
  return result;
};

module.exports = fn;
