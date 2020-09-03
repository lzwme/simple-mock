const httpRender = {
  msgEl: document.querySelector('#msgLog'),
  /** 记录请求处理次数 */
  reqTimes: 0,
  init() {
    const defualtUrl = '/res/user/666';
    const inputEl = document.querySelector('#httpSendInput');
    const btnEl = document.querySelector('#httpSendBtn');
    const methodEl = document.querySelector('#httpMethod');
    const contentTypeEl = document.querySelector('#contentType');

    btnEl.addEventListener(
      'click',
      (ev) => {
        const url = inputEl.value.trim() || defualtUrl;
        const opts = {
          method: methodEl.value,
          headers: {
            'Content-Type': contentTypeEl.value,
          },
        };

        if (opts.method === 'post') {
          if (opts.headers['Content-Type'] === 'application/json') {
            opts.body = JSON.stringify({ time: Math.random() });
          } else {
            opts.body = 'time=' + Math.random();
          }
        }

        fetch(url, opts)
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
            this.printMsg(data, url);
          })
          .catch((e) => console.log('Oops, error', e));
      },
      false
    );
  },
  printMsg(data, url) {
    const curIndex = ++this.reqTimes;

    this.msgEl.innerHTML =
      `<p><span class="index">${curIndex}</span> - <span class="url">[${url}]</span>: ${JSON.stringify(data)}</p>` + this.msgEl.innerHTML;
  },
};
httpRender.init();
