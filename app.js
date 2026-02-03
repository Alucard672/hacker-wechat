App({
  onLaunch() {
    console.log('Terminal initialized...');
  },
  globalData: {
    apiUrl: 'https://your-openclaw-server.com/api/v1/sessions/main/send' // 老大，这里明天得改成您实际的地址
  }
})