require('dotenv').config();

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    guildId: process.env.GUILD_ID,
    channelIds: {
      chatMonitor: process.env.CHAT_MONITOR_CHANNEL_ID,
      youtubePost: process.env.YOUTUBE_POST_CHANNEL_ID,
      tiktokPost: process.env.TIKTOK_POST_CHANNEL_ID
    },
    ownerId: process.env.OWNER_ID
  },
  
  youtube: {
    channelUrl: process.env.YOUTUBE_CHANNEL_URL,
    checkInterval: parseInt(process.env.YOUTUBE_CHECK_INTERVAL) || 300000
  },
  
  tiktok: {
    username: process.env.TIKTOK_USERNAME,
    checkInterval: parseInt(process.env.TIKTOK_CHECK_INTERVAL) || 300000
  },
  
  payment: {
    enabled: true,
    gopayPhone: process.env.GOPAY_PHONE || '62812345678',
    gopayMerchantId: process.env.GOPAY_MERCHANT_ID || 'MERCHANT_ID',
    qrisString: process.env.QRIS_STRING || '',
    // TAMBAHKAN BARIS DI BAWAH INI
    qrisImagePath: './assets/qris.png', 
    bankAccounts: {
      bca: {
        name: 'BCA',
        number: process.env.BANK_BCA || '1234567890',
        holder: process.env.BANK_HOLDER || 'Nama Penerima'
      },
      mandiri: {
        name: 'Mandiri',
        number: process.env.BANK_MANDIRI || '0987654321',
        holder: process.env.BANK_HOLDER || 'Nama Penerima'
      }
    }
  },
  
  bot: {
    prefix: process.env.BOT_PREFIX || '!',
    responseDelay: parseInt(process.env.RESPONSE_DELAY) || 1000
  }
};
