import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import ejs from 'ejs';
import compress from 'compression';
import routes from './router';
import { fnProxy } from './proxy';
import config from './config';

const app: any = express();

app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, './views'));

if (process.env.GZIP !== '0') app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 接口代理配置与mock，放到 bodyParser 之后，以方便自定义 mock 处理逻辑时，可从 req.body 直接读取 post 请求参数
fnProxy({ app });

app.use(cookieParser());
app.use(express.static(path.join(__dirname, './views/static')));
app.use('/', routes);

// 错误处理。开发模式下打印错误堆栈信息
app.use((err, req, res, next) => {
  if (config.isDev && err) {
    console.log(err);
  }

  res.status(err.status || 500).send({
    message: err.message,
    errorInfo: config.isDev ? err : '内部错误',
  });
});

export default app;
