const app = getApp();

Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getPhoneNumber')
  },

  onLoad() {
    // 检查是否已经登录
    const phone = wx.getStorageSync('user_phone');
    if (phone) {
      wx.reLaunch({ url: '../index/index' });
      return;
    }

    // 静默登录获取 OpenID (通过 code 模拟)
    wx.login({
      success: (res) => {
        if (res.code) {
          // 在实际项目中，这里应该发给后端换取真实的 openid
          const openid = `id-${res.code}`; 
          wx.setStorageSync('user_openid', openid);
        }
      }
    });
  },

  getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const { code } = e.detail;
      const openid = wx.getStorageSync('user_openid') || 'unknown';
      
      wx.showLoading({ title: 'AUTHENTICATING...' });

      // 模拟后端换取手机号逻辑
      // 实际开发中，请将 code 和 openid 发送到后端，后端调用微信 API 获取手机号
      setTimeout(() => {
        const mockPhone = '138****8888'; // 这里应当是后端返回的真实手机号
        wx.setStorageSync('user_phone', mockPhone);
        
        // sessionKey 使用 openid 确保全局唯一且稳定
        wx.setStorageSync('claw_session_key', openid);
        app.globalData.sessionKey = openid;

        wx.hideLoading();
        wx.reLaunch({ url: '../index/index' });
      }, 1200);
    } else {
      wx.showToast({ title: '需要手机号登录', icon: 'none' });
    }
  }
});