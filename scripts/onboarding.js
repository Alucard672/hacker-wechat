# onboarding.js - Handle New User Onboarding

/**
 * This script is triggered for new users who don't have a profile yet.
 */
async function onboard(userId) {
  const profilePath = `memory/${userId}/USER.md`;
  
  // 1. Check if user already exists
  if (await exists(profilePath)) return;

  // 2. Ask for name/nickname and preferences
  await send("欢迎来到 OpenClaw！我是你的极客助手 🛠️。");
  const nickname = await ask("我该怎么称呼你？（例如：老大、老板、或者你的名字）");
  const preferences = await ask("你有什么特别的偏好吗？（比如：简洁回答、多用表情符号、或者特定的技术领域）");

  // 3. Create user directory and initial files
  await mkdir(`memory/${userId}`);
  const userMd = `# USER.md - Profile for ${userId}
- **Name:** ${userId}
- **What to call them:** ${nickname}
- **Preferences:** ${preferences}
- **Timezone:** Asia/Shanghai
`;
  await write(profilePath, userMd);
  await write(`memory/${userId}/MEMORY.md`, "# Long-term Memory\n");
  
  await send(`没问题，${nickname}！我已经记下了你的偏好。现在我们可以开始工作了。`);
}
