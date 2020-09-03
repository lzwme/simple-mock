const pageRender = {
  el: {
    // wsSize: document.getElementById('wsSize'),
    msgEl: document.getElementById('msgEdit'),
    isClearMsg: document.getElementById('isClearMsg'),
    formatBtn: document.getElementById('formatBtn'),
    sendMsgBtn: document.getElementById('sendMsgBtn'),
    showTip: document.getElementById('showTip'),
  },
  // renderWsSize(size = 0) {
  //   this.el.wsSize.innerText = size;
  // },
  init() {
    if (!this.el.sendMsgBtn) return;
    this.el.sendMsgBtn.addEventListener('click', (ev) => {
      ev.preventDefault();

      if (wsClient.ws.readyState === wsClient.ws.CLOSED) {
        this.showTip('websocket 连接已断开，尝试重连...');
        wsClient.initWebSocket();
        return;
      }

      let msg = this.el.msgEl.value.trim();

      if (msg) {
        msg = wsClient.parseMsg(msg);
        console.log('发送mock信息：', msg);
        wsClient.sendMsg(msg);

        if (this.el.isClearMsg.checked) {
          this.el.msgEl.value = '';
        }
      } else {
        this.showTip('请输入要模拟的消息后再发送');
      }
    });

    if (!this.el.formatBtn) return;

    this.el.formatBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      let msg = this.el.msgEl.value.trim();
      if (!msg) {
        this.showTip('消息内容为空', 'warn');
        return;
      }
      try {
        msg = wsClient.parseMsg(msg);
        this.el.msgEl.value = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
      } catch (err) {
        this.showTip('不是有效的 JSON 格式信息', 'error');
      }
    });
  },
  tipTimer: 0,
  showTip(msg, type = 'info', timeout = 3000) {
    const tipEl = this.el.showTip;

    tipEl.innerText = msg;
    'hide info error success warn'.split(' ').forEach((d) => tipEl.classList.remove(d));
    tipEl.classList.add(type);
    clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => tipEl.classList.add('hide'), timeout);
  },
};
const wsClient = {
  ws: null,
  wsSize: 0,
  init() {
    this.initWebSocket();
    pageRender.init();
  },
  parseMsg(data) {
    if (!data) return data;
    data = String(data);

    try {
      return JSON.parse(data);
    } catch {
      try {
        var _tt = data;
        eval(`_tt = ${data}`);
        return _tt;
      } catch {
        pageRender.showTip('数据格式化失败', 'error');
        return data;
      }
    }
  },
  initWebSocket() {
    const url = 'ws://localhost:2222/ws'; // location.origin.replace('http:', 'ws:') + '/ws';
    const ws = new WebSocket(url);
    ws.onmessage = (ev) => {
      const data = this.parseMsg(ev.data);
      // console.log(ev, data);
      this.onMessage(data);
    };
    ws.onopen = () => {
      pageRender.showTip('websocket 连接成功！');
    };
    ws.onclose = () => {
      pageRender.showTip('websocket 连接已断开！', 'warn');
    };

    this.ws = ws;
  },
  sendMsg(msg) {
    const data = {
      msg,
      now: new Date().toLocaleTimeString(),
      reqmsgid: 'ws_' + Date.now(),
    };
    this.ws.send(JSON.stringify(data));
  },
  onMessage(info) {
    if (!info) return;
    console.log('来消息了', info);

    if (httpRender) {
      httpRender.printMsg(info, 'from ws');
    }
    // 消息 mock 发送成功
    if (info === 'ok') {
      pageRender.showTip('消息发送成功！', 'success');
    }
  },
};

wsClient.init();
