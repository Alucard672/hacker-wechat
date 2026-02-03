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