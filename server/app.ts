const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const compress = require('compression');
const routes = require('./router');
const fnProxy = require('./proxy');
const app = express({});
const isDev = require('./config').isDev;

app.engine('.html', ejs.__express);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, './views'));

app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// 接口代理配置与mock，放到 bodyParser 之后，以方便自定义 mock 处理逻辑时，可从 req.body 直接读取 post 请求参数
fnProxy({ app });

app.use(cookieParser());
app.use(express.static(path.join(__dirname, './views/static')));
app.use('/', routes);

// 错误处理。开发模式下打印错误堆栈信息
app.use((err, req, res, next) => {
  if (isDev && err) {
    console.log(err);
  }

  res.status(err.status || 500).send({
    message: err.message,
    errorInfo: isDev ? err : '内部错误',
  });
});

module.exports = app;
export default app;
