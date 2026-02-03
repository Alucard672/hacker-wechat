App({
  onLaunch() {
    console.log('Terminal initialized...');
  },
  globalData: {
    apiUrl: 'https://your-openclaw-server.com/api/v1/sessions/main/send',
    uploadUrl: 'https://your-openclaw-server.com/api/v1/files/upload' 
  }
})