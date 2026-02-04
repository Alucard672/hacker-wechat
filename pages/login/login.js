const app = getApp();

function buildLoginUrl(apiUrl) {
  const base = (apiUrl || '').replace(/\/+$/, '');
  if (base.endsWith('/wechat')) {
    return `${base}/login`;
  }
  return `${base}/wechat/login`;
}

Page({
  data: {
    status: '初始化中...',
    loading: false,
    openId: '',
    phone: ''
  },

  onLoad() {
    this.startLogin();
  },

  startLogin() {
    if (this.data.loading) return;
    const cachedOpenId = wx.getStorageSync('claw_openid') || '';
    const cachedPhone = cachedOpenId ? wx.getStorageSync(`claw_phone_${cachedOpenId}`) : '';
    if (cachedPhone) {
      this.setData({ phone: String(cachedPhone) });
    }
    this.setData({ loading: true, status: '正在登录...' });

    wx.login({
      success: (res) => {
        if (!res.code) {
          this.setData({ loading: false, status: '登录失败：无 code' });
          return;
        }

        const loginUrl = buildLoginUrl(app.globalData.apiUrl);
        wx.request({
          url: loginUrl,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: res.code },
          success: (resp) => {
            const openId = resp.data && resp.data.openid ? String(resp.data.openid) : '';
            const phone = resp.data && resp.data.phone ? String(resp.data.phone) : '';
            if (!openId) {
              this.setData({
                loading: false,
                status: '登录失败：无 openid',
                openId: ''
              });
              return;
            }
            wx.setStorageSync('claw_openid', openId);
            if (phone) {
              wx.setStorageSync(`claw_phone_${openId}`, phone);
            }
            app.globalData.openId = openId;
            app.globalData.sessionKey = openId;
            this.setData({
              loading: false,
              status: phone ? '已绑定手机号，正在进入聊天' : '登录成功，请绑定手机号',
              openId,
              phone: phone || ''
            });
            if (phone) {
              wx.reLaunch({ url: '/pages/index/index' });
            }
          },
          fail: (err) => {
            this.setData({
              loading: false,
              status: `登录失败：${err.errMsg || 'UNKNOWN_ERROR'}`
            });
          }
        });
      },
      fail: (err) => {
        this.setData({
          loading: false,
          status: `登录失败：${err.errMsg || 'UNKNOWN_ERROR'}`
        });
      }
    });
  },

  retryLogin() {
    this.startLogin();
  },

  bindPhone(e) {
    const openId = this.data.openId;
    if (!openId) {
      this.setData({ status: '请先登录后再绑定手机号' });
      return;
    }
    const code = e?.detail?.code;
    if (!code) {
      this.setData({ status: '绑定失败：无 code' });
      return;
    }
    const base = (app.globalData.apiUrl || '').replace(/\/+$/, '');
    const url = base.endsWith('/wechat') ? `${base}/phone` : `${base}/wechat/phone`;
    wx.request({
      url,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { openid: openId, code },
      success: (resp) => {
        const phone = resp.data && resp.data.phone ? String(resp.data.phone) : '';
        if (!phone) {
          this.setData({ status: '绑定失败：未获取手机号' });
          return;
        }
        wx.setStorageSync(`claw_phone_${openId}`, phone);
        this.setData({ status: '手机号绑定成功', phone });
        wx.reLaunch({ url: '/pages/index/index' });
      },
      fail: (err) => {
        this.setData({ status: `绑定失败：${err.errMsg || 'UNKNOWN_ERROR'}` });
      }
    });
  },

  goChat() {
    if (!this.data.openId) {
      this.setData({ status: '请先登录' });
      return;
    }
    if (!this.data.phone) {
      this.setData({ status: '请先绑定手机号' });
      return;
    }
    wx.reLaunch({ url: '/pages/index/index' });
  }
});
