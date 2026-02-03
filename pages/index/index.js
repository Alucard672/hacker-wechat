const app = getApp();

Page({
  data: {
    messages: [
      { id: 'm0', time: '01:22', type: 'system', text: 'CONNECTION ESTABLISHED. SYSTEM ONLINE.' }
    ],
    inputValue: '',
    lastMessageId: 'm0',
    isTyping: false
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
        this.addMessage('user', `Sending file: ${file.name}`, { file: file.path, fileName: file.name });
        this.uploadFile(file.path, 'file');
      }
    });
  },

  // 语音输入
  startVoice() {
    this.recorder = wx.getRecorderManager();
    this.recorder.start({ format: 'mp3' });
    wx.showToast({ title: 'RECORDING...', icon: 'none' });
  },

  stopVoice() {
    this.recorder.stop();
    this.recorder.onStop((res) => {
      this.addMessage('user', 'Sent a voice message.');
      this.uploadFile(res.tempFilePath, 'audio');
    });
  },

  uploadFile(path, type) {
    this.setData({ isTyping: true });
    wx.uploadFile({
      url: app.globalData.uploadUrl,
      filePath: path,
      name: 'file',
      formData: { type: type },
      success: (res) => {
        this.addMessage('system', 'FILE RECEIVED AND PROCESSED.');
      },
      fail: () => {
        this.addMessage('system', 'ERROR: UPLOAD FAILED.');
      },
      complete: () => {
        this.setData({ isTyping: false });
      }
    });
  },

  addMessage(type, text, extra = {}) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = (type[0]) + Date.now();
    this.setData({
      messages: [...this.data.messages, { id, time: timestamp, type, text, ...extra }],
      lastMessageId: id
    });
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = 'u' + Date.now();
    
    const newMessages = [...this.data.messages, {
      id: userMsgId,
      time: timestamp,
      type: 'user',
      text: text
    }];

    this.setData({
      messages: newMessages,
      inputValue: '',
      lastMessageId: userMsgId,
      isTyping: true
    });

    // 这里是调用 OpenClaw 的逻辑
    wx.request({
      url: app.globalData.apiUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_TOKEN' // 老大，以后要加鉴权的话放这
      },
      data: {
        message: text
      },
      success: (res) => {
        const sysMsgId = 's' + Date.now();
        this.setData({
          messages: [...this.data.messages, {
            id: sysMsgId,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'system',
            text: res.data.reply || 'COMMAND EXECUTED.'
          }],
          lastMessageId: sysMsgId
        });
      },
      fail: () => {
        const errId = 'e' + Date.now();
        this.setData({
          messages: [...this.data.messages, {
            id: errId,
            time: timestamp,
            type: 'system',
            text: 'ERROR: UPLINK FAILED.'
          }],
          lastMessageId: errId
        });
      },
      complete: () => {
        this.setData({ isTyping: false });
      }
    });
  }
})