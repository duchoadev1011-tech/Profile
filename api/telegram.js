// Đây là code chạy trên server Vercel, không phải trên trình duyệt
// Nên Token được giấu an toàn trong Environment Variables

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).end();

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Chỉ cho phép Admin điều khiển (Chat ID của bạn)
  const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
  if (String(chatId) !== String(ADMIN_CHAT_ID)) {
    await sendMessage(chatId, "❌ Bạn không có quyền điều khiển bot này.");
    return res.status(200).end();
  }

  const [command, ...args] = text.split(' ');
  const value = args.join(' ');

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO; // "duchoadev1011-tech/Profile"
  const FILE_PATH = 'data.json';

  try {
    // 1. Lấy dữ liệu hiện tại từ GitHub
    const getRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TelegramBot'
      }
    });
    const fileData = await getRes.json();
    const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'));
    const sha = fileData.sha;

    let updated = false;
    let replyMsg = '';

    // 2. Xử lý các lệnh
    switch (command) {
      case '/setname': 
        currentContent.name = value; 
        replyMsg = `✅ Đã đổi tên thành: ${value}`; 
        updated = true; 
        break;
      case '/setavatar': 
        currentContent.avatar = value; 
        replyMsg = `✅ Đã đổi avatar.`; 
        updated = true; 
        break;
      case '/setcover': 
        currentContent.cover = value; 
        replyMsg = `✅ Đã đổi ảnh bìa.`; 
        updated = true; 
        break;
      case '/setbio': 
        currentContent.bio = value; 
        replyMsg = `✅ Đã đổi bio.`; 
        updated = true; 
        break;
      case '/setfacebook': 
        currentContent.facebook = value; 
        replyMsg = `✅ Đã đổi link Facebook.`; 
        updated = true; 
        break;
      case '/setdiscord': 
        currentContent.discord = value; 
        replyMsg = `✅ Đã đổi link Discord.`; 
        updated = true; 
        break;
      case '/setzalo': 
        currentContent.zalo = value; 
        replyMsg = `✅ Đã đổi link Zalo.`; 
        updated = true; 
        break;
      case '/settelegram': 
        currentContent.telegram = value; 
        replyMsg = `✅ Đã đổi link Telegram.`; 
        updated = true; 
        break;
      case '/view': 
        replyMsg = `📋 Dữ liệu hiện tại:\n${JSON.stringify(currentContent, null, 2)}`; 
        await sendMessage(chatId, replyMsg); 
        return res.status(200).end();
      case '/help': 
        replyMsg = `🤖 Danh sách lệnh:\n/setname [tên]\n/setavatar [link]\n/setcover [link]\n/setbio [mô tả]\n/setfacebook [link]\n/setdiscord [link]\n/setzalo [link]\n/settelegram [link]\n/view\n/help`; 
        await sendMessage(chatId, replyMsg); 
        return res.status(200).end();
      default: 
        await sendMessage(chatId, "❓ Lệnh không hợp lệ. Gõ /help để xem hướng dẫn."); 
        return res.status(200).end();
    }

    // 3. Cập nhật lại file data.json trên GitHub
    if (updated) {
      await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `token ${GITHUB_TOKEN}`, 
          'Accept': 'application/vnd.github.v3+json', 
          'User-Agent': 'TelegramBot', 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          message: `Update via Bot: ${command}`, 
          content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString('base64'), 
          sha: sha 
        })
      });
      await sendMessage(chatId, replyMsg);
    }
  } catch (error) {
    await sendMessage(chatId, `❌ Lỗi: ${error.message}`);
  }
  res.status(200).end();
}

// Hàm gửi tin nhắn về Telegram
async function sendMessage(chatId, text) {
  const token = process.env.TELEGRAM_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
  });
  }
