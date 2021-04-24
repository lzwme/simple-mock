
# SIMPLE-MOCK

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/@lzwme/simple-mock.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@lzwme/simple-mock
[download-image]: https://img.shields.io/npm/dm/@lzwme/simple-mock.svg?style=flat-square
[download-url]: https://npmjs.org/package/@lzwme/simple-mock


以注入到 `node server` 的 API 代理方式，实现简洁而功能强大的 API MOCK 功能。附带自动保存真实 API 接口返回数据功能。

<img src="https://github.com/lzwme/simple-mock/blob/master/docs/screenshots/mock_enablemock.png?raw=true">

## SIMPLE-MOCK 简介

### 特色

- `不侵入浏览器端代码`：node server 注入模式实现 MOCK，不影响浏览器端编码
- `MOCK 实现简单`：可自动保存后端 API 返回内容，mock 数据编写无需繁琐流程
- `自定义 MCOK 方式简单强大`：commonjs 方式自定义 MOCK 数据文件编写，无学习门槛，能实现各种自定义逻辑
- `自定义 MOCK 文件修改实时生效`：高效复现不同数据场景
- `配置文件实时生效`：自由切换生产与 MOCK 数据，排查比对问题方便高效
- `支持接口过滤规则`：只针对部分接口进行 MOCK 或 不 MOCK，只需修改一下配置文件
- `支持 TypeScript`：配置文件、自定义 mock 规则文件均支持以 TypeScript 方式编写(文件需以 .ts 结尾)
- `支持 websocket 服务 MOCK`
- more...

### 何时使用

- `与后端同步开发时`：根据约定自定义接口规则，MOCK 数据进行功能开发
- `需重现不同数据场景时`：根据需求描述、测试反馈等，MOCK 相关数据不同的取值实现不同场景重现。重现测试反馈问题 so easy
- `后端服务响应慢、不可用时`：默认开启的自动保存功能，已经将平时请求的接口数据进行了基本的保存。只需要修改配置文件开启 Mock 即立即生效，避免阻塞前端研发
- more...

## 安装与使用

### 安装

```bash
yarn add -d @lzwme/simple-mock
```

### 使用

在 nodejs 服务中的 API 代理部分，加入 `simpleMock.render`、 `simpleMock.saveApi` 相关 API 接入逻辑。
针对 `websocket` 的 MOCK 方案可参考 `ws-proxy-server` 目录下的示例。

这里以 `http-proxy` 作为代理示例，具体参见 `server/app.js` 中的源码。示例参考：

```js
const app = require('express')();
const bodyParser = require('body-parser');
const httpProxy = require('http-proxy');
const apiProxy = httpProxy.createProxyServer();
const queryString = require('querystring');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/**
 * 接口代理配置与mock
 */
const simpleMock = require('@lzwme/simple-mock');

app.all('/{api,rest}/**', async function(req, res) {
  // 开发模式下且可 mock 的情况
  if (appConfig.media === 'dev' && await simpleMock.render(req, res)) {
    return;
  }

  console.log('[apiProxy]', req._parsedUrl.pathname);
  apiProxy.web(req, res, {target: config[proxyTarget]});
});

// 在代理返回时，注入 saveApi 方法
apiProxy.on('proxyRes', function (proxyRes, req, res) {
  const encoding = proxyRes.headers['content-encoding'];

  apiMock.saveApi(req, res, encoding);
  if (!['gzip', '‘deflate'].includes(encoding)) {
    const bufs = [];

    proxyRes.on('data', (data) => bufs.push(data));
    proxyRes.on('end', () => {
      let body = Buffer.concat(bufs).toString();
      res.end(body);
    });
  }
});

// 以下为针对 post 请求，代理消费了 stream 的情况
// 针对 post 请求，将 (express.js)bodyParser 消费过的 stream 重新写回到 req
apiProxy.on('proxyReq', function(proxyReq, req, res, options) {
  if (!req.body || !Object.keys(req.body).length) {
    return;
  }

  const contentType = proxyReq.getHeader('Content-Type');
  let bodyData;

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
```

另外，这里还有两篇相关文章可参考：

- [在 Vue-CLI 中引入 simple-mock 快速实现简易的 API Mock 接口数据模拟](https://lzw.me/a/vue-cli-simple-mock.html)
- [在 Angular-cli 中引入 simple-mock 实现前端开发 API Mock 接口数据模拟](https://lzw.me/a/angular-cli-simple-mock.html)

## MOCK 规则

基本的 MOCK 的规则为：

- 以 `config.customSaveFileName` 参数定义 MOCK 文件查找/保存后端返回数据的命名规则。对于 http 服务，默认为将请求 URL.pathname 路径。最后的文件名会将 `/` 替换为 `_` 并以 js 结尾。例如，请求 URL 为 `/a/b/c?t=123`，则对应的默认文件名为 `a_b_c.js`
- 关于 MOCK 文件规则：
  - 导出内容可为普通对象或数组、字符等，将直接作为 API 返回内容
  - 导出内容可为函数，函数传入参数 req 和 req 对象。此时：
    - 可根据 req.query 处理不同的返回内容；
    - 可直接处理返回信息。如： `res.status(200).send(content)`，`res.status(403).send('禁止访问')`(模拟出错)
- Mock 文件可存在于三个目录中，其优先级为：`customdata > mockdata > customdata/autosave`
  - `mockdata` 目录用于存放常用的公共 API 规则，会提交至 GIT 仓库
  - `customdata` 目录用于自定义 API 规则，不会提交至 GIT 仓库。该目录优先级最高
  - `customdata/autosave` 目录用于自动保存后端返回数据，也是保底的 mock 规则
- 不 MOCK 的情况(代理至后端 API)：
  - 符合规则的文件不存在
  - 文件导出内容为 `undefined`、`null` 或者  `__ignore_mock__`

**mock 文件查找规则：**

- 先查找 `${config.mockFileDir}/customdata` 目录
- 再查找 `${config.mockFileDir}/mockdata` 目录
- 最后查找 `${config.mockFileDir}/customdata/autosave` 目录
- 都没有，则走转发到真实 API 代理。如果开启了自动保存，则会将返回结果保存到 `autosave` 目录中

### 自定义 mock 文件内容示例

当开启自动保存 API 内容时，`autosave` 目录内容下会生成 API 请求返回的结果。当需要对这些 API 进行自定义的规则时，可直接编辑它，不过更推荐将其复制到 `mockdata` 目录中，然后重新编辑器内容规则。下面为一个以函数方式定义的规则参考示例(可参考 `mock/mockdata/rest_user_666.ts` 文件内容)：

```js
module.exports = (req, res) => {
  console.log(req.body, req.query);
  // console.log(req.ip, req.ips, req.originalUrl);
  // 你甚至可以直接发送各种状态来返回结果(这里 server 以 express 为例)
  // res.status(500).send({ error: 'something blew up' });

  const result = {
    "code": 200,
    "url": req.url,
    "data": {
      "name": "lzw",
      "webSite": "https://lzw.me"
    },
    "date": new Date().toLocaleString(),
    "query": req.query,
    "body": req.body,
  };

  return result;
};
```

## 配置与 API

### 开启/关闭 mock 的配置方法

- 配置文件方式

项目根目录 `simple-mock-config.js` 为配置文件，应自行创建，并配置 `.gitignore` 中忽略它，以便于随时修改 mock 行为而不影响其他开发者。配置内容示例可参考 `simple-mock-config-sample.js` 文件。

- 环境变量方式

环境变量主要用于开启或关闭相关功能。其功能开启的优先级高于 `simple-mock-config.js` 中的配置。

- 开启MOCK功能 `process.env.MOCKAPI_ENABLE=mock`
- 开启自动保存API返回内容 `process.env.MOCKAPI_AUTOSAVE=save`
- 强制每次请求都保存API返回内容(未开启MOCK功能时有效，一般不推荐开启) `process.env.MOCKAPI_AUTOSAVE_FORCE=force`

```bash
# 开启MOCK功能
set MOCKAPI_ENABLE=mock # process.env.MOCKAPI_ENABLE=mock
# 开启自动保存API返回内容
set MOCKAPI_AUTOSAVE=save # process.env.MOCKAPI_AUTOSAVE=save
# 强制每次请求都保存API返回内容(未开启MOCK功能时有效，一般不推荐开启)
set MOCKAPI_AUTOSAVE_FORCE=force # process.env.MOCKAPI_AUTOSAVE_FORCE=force
```

### API

- `render(req, res, apiPath?): Promise<boolean>`

判断一个请求是否可 mock，如果满足条件则执行 mock 逻辑。
应在 nodejs 服务中代理转发前执行。返回一个 Promise，结果为 `true` 则表示可 mock，停止继续执行代理转发；否则为不 mock，应继续走代理转发逻辑。
`req` 和 `res` 会传递到 mocK 规则文件中的自定义规则函数参数中，可通过 `req` 和 `res` 参数自行处理 mock 数据逻辑。

- `saveApi(req, res, contentEncoding)`

在代理请求返回时执行，以判定是否需要保存后端返回的 API 数据。

注意： `contentEncoding` 取值为 `encoded` 时， `res` 应为需要直接保存的 JSON 格式的内容。如：

```js
simpleMock.saveApi(req, {user: 'zhansan'}, 'encoded');
```

- `renderWs(reqData, client, filename = '')`

针对 websocket 类型的 mock。client 参数可自行实现一些方法，其将在 mock 文件规则为函数时传入为第二个参数。

- `saveData: (data, filename = '')`

主要是用于 websocket 服务端返回消息的保存。若 `filename` 为空，则具体的文件规需根据 config.customSaveFileName 确定。

## FAQ / MOCK规则编写示例与技巧

- 如何保存通过代理返回的信息？

关闭 mock 功能，开启自动保存API功能：

```bash
process.env.MOCKAPI_ENABLE=N
process.env.MOCKAPI_AUTOSAVE=save
```

- 在开启 mock 模式下，如何忽略某个 API 请求的 mock，从真实后端 API 去请求？

在 `mock/customdata`目录中，编辑该 API 对应的 mock 文件，将返回值改为 `__ignore_mock__`。如果需要根据参数来处理，也是可以实现的，示例：

```js
// 忽略mock
module.exports = '__ignore_mock__';
// or
module.exports = req => {
  const query = Object.assign({}, req.query, req.body);
  // id 为 1 则不 mock
  if (+query.id === 1) {
    return '__ignore_mock__';
  }

  return {...};
}
```

- `小技巧`：对于同一 API，如何快速保存不同参数返回的不同的值？

简单的数据返回，在 `customdata` 目录下自行写 Javascript 逻辑即可。但对于不同参数返回结果复杂、差异巨大这种情况，自行写逻辑就变得繁琐。

一种方式是通过定义 `config.customSaveFileName` 参数，根据不同的参数将他们落地为不同的文件。

另一种方式是可以关闭 MOCK，开启自动保存和强制保存：
```js
module.exports = {
  mockFileDir: 'mock',
  isEnableMock: false,
  isAutoSaveApi: true,
  isForceSaveApi: true,
}
```
然后每触发一次请求成功后，到 `customdata/autosave` 中找到返回内容并复制出来，如此即可快速得到不同的返回值，再到`customdata` 中编写自定义函数处理规则，根据不同参数定义不同的返回逻辑。如果是比较公共性的逻辑，也可以编写到 `mockdata` 目录中。

- mock 模式下，API 对应 mock 文件不存在时，会转发至后端。但此时会报错？

登陆信息为 mock 返回，session 为无效信息，转发至后端登陆认证失败，API 请求自然也不会成功。
此时可关闭 mock 功能，正常登陆一次，再开启mock；也可临时关闭登陆相关 API 的 mock。

- 忽略自定义目录 customdata 的内容，使用公共目录下的 mockdata?

当 customdata 目录下有符合的规则时，会优先使用，否则则使用 mockdata 下的规则定义。因此，删除 customdata 目录下的定义即可。
但是因为开启 `saveApi` 会自动保存到 customdata，所以还有一种办法，就是在该目录下的文件中导出值为 `undefined`：

```js
module.exports = void(0);
```

- `saveApi` 保存的某 API 的内容陈旧过时？

手动修改对应 mock 数据文件内容，或者删除该文件，以重新自动保存远端请求的结果。也可开启 `config.isForceSaveApi` 参数自动更新
- more...

## 开发与测试

```bash
git clone https://github.com/lzwme/simple-mock.git
cd simple-mock

yarn run dev
yarn run serve:ws
yarn run serve
```

## 其他相关

- [Simple Mock(PPT)](https://lzw.me/pages/share/ppt/simple-mock.html)
- [在 Vue-CLI 中引入 simple-mock 快速实现简易的 API Mock 接口数据模拟](https://lzw.me/a/vue-cli-simple-mock.html)
- [在 Angular-cli 中引入 simple-mock 实现前端开发 API Mock 接口数据模拟](https://lzw.me/a/angular-cli-simple-mock.html)
