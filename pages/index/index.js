const app = getApp();

function loadHistory(openId) {
  if (!openId) return [];
  const data = wx.getStorageSync(`claw_history_${openId}`);
  if (!Array.isArray(data)) return [];
  return data.map((msg, index) => ({
    ...msg,
    isLatest: index === data.length - 1
  }));
}

function saveHistory(openId, messages) {
  if (!openId) return;
  wx.setStorageSync(`claw_history_${openId}`, messages);
}

Page({
  data: {
    messages: [
      { id: 'm0', time: '01:22', type: 'system', text: '极客笔记已就绪。', isLatest: true }
    ],
    inputValue: '',
    lastMessageId: 'm0',
    isTyping: false,
    currentUser: ''
  },

  onLoad() {
    const openId = wx.getStorageSync('claw_openid');
    if (!openId) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    const phone = wx.getStorageSync(`claw_phone_${openId}`);
    if (!phone) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    const accessStatus = wx.getStorageSync(`claw_access_${openId}`);
    if (accessStatus && accessStatus !== 'approved') {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    app.globalData.openId = openId;
    app.globalData.sessionKey = openId;
    const nickname = wx.getStorageSync(`claw_nick_${openId}`) || '用户';
    const display = phone ? `${nickname} · ${phone}` : nickname;
    this.setData({ currentUser: display });

    const history = loadHistory(openId);
    if (history.length) {
      this.setData({
        messages: history,
        lastMessageId: history[history.length - 1].id
      });
    }
  },

  // 选择并上传图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0].tempFilePath;
        this.addMessage('user', '', { image: path });
        this.uploadFile(path, 'image');
      }
    });
  },

  // 选择并上传文件 (PDF/DOC等)
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        this.addMessage('user', `发送文件：${file.name}`, { file: file.path, fileName: file.name });
        this.uploadFile(file.path, 'file');
      }
    });
  },

  // 语音输入
  startVoice() {
    this.recorder = wx.getRecorderManager();
    this.recorder.start({ format: 'mp3' });
    wx.showToast({ title: '录音中...', icon: 'none' });
  },

  stopVoice() {
    this.recorder.stop();
    this.recorder.onStop((res) => {
      this.addMessage('user', '已发送语音消息。');
      this.uploadFile(res.tempFilePath, 'audio');
    });
  },

  uploadFile(path, type) {
    this.setData({ isTyping: true });
    wx.uploadFile({
      url: app.globalData.uploadUrl,
      filePath: path,
      name: 'file',
      formData: { type: type, sessionKey: app.globalData.openId || app.globalData.sessionKey || '' },
      success: (res) => {
        let msg = '文件已接收并处理。';
        try {
          const data = JSON.parse(res.data);
          msg = data.reply || data.message || msg;
        } catch (e) {}

        this.addMessage('system', msg);
      },
      fail: (err) => {
        this.addMessage('system', `错误：上传失败（${err.errMsg}）`);
      },
      complete: () => {
        this.setData({ isTyping: false });
      }
    });
  },

  addMessage(type, text, extra = {}) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = type[0] + Date.now() + Math.floor(Math.random() * 1000);
    const nextMessages = this.data.messages.map((msg) => ({ ...msg, isLatest: false }));
    const updatedMessages = [...nextMessages, { id, time: timestamp, type, text, isLatest: true, ...extra }];

    this.setData({
      messages: updatedMessages,
      lastMessageId: id
    });

    saveHistory(app.globalData.openId, updatedMessages);
    return id;
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;

    this.addMessage('user', text);

    this.setData({
      inputValue: '',
      isTyping: true
    });

    // 这里是调用 OpenClaw 的逻辑
    wx.request({
      url: app.globalData.apiUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      },
      data: {
        model: 'openclaw:main',
        messages: [{ role: 'user', content: text }],
        user: app.globalData.openId || app.globalData.sessionKey || ''
      },
      success: (res) => {
        // 增加对不同返回格式的兼容处理
        let replyText = '已执行。';
        if (res.data) {
          replyText = res.data.reply || res.data.message || (typeof res.data === 'string' ? res.data : replyText);
        }

        this.addMessage('system', replyText);
      },
      fail: (err) => {
        console.error('Uplink error:', err);
        this.addMessage('system', `错误：请求失败（${err.errMsg || 'UNKNOWN_ERROR'}）`);
      },
      complete: () => {
        this.setData({ isTyping: false });
      }
    });
  },

  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    if (!src) return;
    wx.previewImage({ urls: [src] });
  },

  openFile(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.openDocument({ filePath: url, showMenu: true });
  }
});
