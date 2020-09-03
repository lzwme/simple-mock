const pageRender = {
  el: {
    wsSize: document.getElementById('wsSize'),
    // msgEl: document.getElementById('msgEdit'),
    isClearMsg: document.getElementById('isClearMsg'),
    formatBtn: document.getElementById('formatBtn'),
    sendMsgBtn: document.getElementById('sendMsgBtn'),
    showTip: document.getElementById('showTip'),
  },
  renderWsSize(size = 0) {
    this.el.wsSize.innerText = size;
  },
  init() {
    this.el.sendMsgBtn.addEventListener('click', (ev) => {
      ev.preventDefault();

      if (wsClient.ws.readyState === wsClient.ws.CLOSED) {
        this.showTip('websocket 连接已断开，尝试重连...');
        wsClient.initWebSocket();
        return;
      }

      if (!wsClient.ws || !wsClient.wsSize) {
        return this.showTip('无活动的 ws 连接，请刷新页面重试');
      }

      let msg = codeEditor.getValue();

      if (msg) {
        msg = wsClient.parseMsg(msg);
        console.log('发送mock信息：', msg);
        wsClient.ws.send(
          JSON.stringify({
            type: 'mock',
            data: msg,
          })
        );
        if (this.el.isClearMsg.checked) {
          codeEditor.setValue('');
        }
      } else {
        this.showTip('请输入要模拟的消息后再发送');
      }
    });

    this.el.formatBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      let msg = codeEditor.getValue();
      if (!msg) {
        this.showTip('消息内容为空', 'warn');
        return;
      }
      try {
        msg = wsClient.parseMsg(msg);
        codeEditor.setValue(typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2));
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
const codeEditor = {
  // @see {@link https://codemirror.net/doc/manual.html#config}
  editor: null,
  init() {
    this.editor = CodeMirror.fromTextArea(document.getElementById('msgEdit'), {
      lineNumbers: true,
      matchBrackets: true,
      continueComments: 'Enter',
      viewportMargin: Infinity,
      placeholder: '请输入要模拟发送的信息',
      mode: 'text/typescript',
      // mode: 'application/ld+json',
      extraKeys: {
        'Ctrl-/': 'toggleComment',
        'Alt-/': 'autocomplete',
        // 'Ctrl-Space': 'autocomplete',
      },
      hintOptions: {
        completeSingle: false,
        completeOnSingleClick: true,
      },
    });
    // this.editor.on('cursorActivity', () => {
    //     var words = this.editor.getValue() + '';
    //     words = words.replace(/[a-z]+[\-|\']+[a-z]+/gi, '').match(/([a-z]+)/gi);
    //     CodeMirror.ukeys = words;
    //     // this.editor.showHint();
    // });
  },

  getValue() {
    return this.editor.getValue().trim();
  },
  setValue(val) {
    return this.editor.setValue(val);
  },
};
const wsClient = {
  ws: null,
  wsSize: 0,
  init() {
    this.initWebSocket();
    codeEditor.init();
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
    const url = location.origin.replace('http:', 'ws:') + '/ws';
    const ws = new WebSocket(url);
    ws.onmessage = (ev) => {
      const data = this.parseMsg(ev.data);
      // console.log(ev, data);
      this.onMessage(data);
    };
    ws.onopen = () => {
      pageRender.showTip('websocket 连接成功！');
      ws.send('get-size');
    };
    ws.onclose = () => {
      pageRender.showTip('websocket 连接已断开！', 'warn');
      pageRender.renderWsSize('连接已断开');
    };

    this.ws = ws;
  },
  onMessage(info) {
    if (!info) return;
    console.log('来消息了', info);

    // 当前 ws 连接数
    if (info.type === 'ws-size') {
      this.wsSize = info.data;
      pageRender.renderWsSize(info.data);
      return;
    }
    // 消息 mock 发送成功
    if (info === 'ok') {
      pageRender.showTip('消息发送成功！', 'success');
    }
  },
};

wsClient.init();
