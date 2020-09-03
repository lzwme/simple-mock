const express = require('express');
const router = express.Router();
const mockData = {
  user: {
    name: 'lzw',
    webSite: 'https://lzw.me',
  },
};
// 代理
router.all('/proxy/**', (req, res, next) => {
  // console.log('请求地址：', req.url);
  const pathname = req._parsedUrl.pathname;
  const msg: any = {
    code: 200,
    url: pathname,
    data: '',
    date: new Date(),
  };

  if (Object.keys(req.body).length) {
    msg.body = req.body;
  }

  if (Object.keys(req.query).length) {
    msg.query = req.query;
  }

  if (pathname.includes('/user')) {
    msg.data = Object.assign(mockData.user);
  }

  res.send(msg);
});

router.get('/', (req, res) => {
  res.render('index.html', {});
});

// 其他 router  404
// router.all('*', function(req, res) {
//   res.render('404.html', {});
// });
router.all('*', (req, res) => {
  res.status(404).send({
    code: 404,
    errorInfo: 'Not found',
  });
});

module.exports = router;
