const { EmbedBuilder } = require('discord.js');
const NodeCache = require('node-cache');

class TikTokMonitor {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.cache = new NodeCache({ stdTTL: 600 }); // Cache 10 menit
    this.lastCheckedVideos = [];
    this.intervalId = null;
  }

  async getLatestVideos() {
    try {
      const username = this.config.tiktok.username;
      console.log(`🎵 Checking TikTok user: ${username}`);
      
      // Note: TikTok API memerlukan scraping atau unofficial API
      // Untuk implementasi penuh, gunakan library seperti TikTok-Api-Unofficial
      // Ini adalah placeholder
      
      return [];
    } catch (error) {
      console.error('❌ Error getting TikTok videos:', error);
      return [];
    }
  }

  async postVideo(video) {
    try {
      const channel = await this.client.channels.fetch(
        this.config.discord.channelIds.tiktokPost
      );

      const embed = new EmbedBuilder()
        .setColor('#25F4EE')
        .setTitle('🎵 Video TikTok Baru!')
        .setDescription(video.description || 'No description')
        .setURL(video.url)
        .setImage(video.thumbnail)
        .setFooter({ text: `By: @${video.author}` })
        .setTimestamp();

      await channel.send({
        embeds: [embed],
        content: `**${video.author}** posted on TikTok!\n🔗 ${video.url}`
      });

      console.log(`✅ Posted TikTok video from @${video.author}`);
    } catch (error) {
      console.error('❌ Error posting TikTok video:', error);
    }
  }

  async check() {
    try {
      const videos = await this.getLatestVideos();
      
      for (const video of videos) {
        if (!this.lastCheckedVideos.includes(video.id)) {
          await this.postVideo(video);
          this.lastCheckedVideos.push(video.id);
          
          // Keep only last 10 videos in memory
          if (this.lastCheckedVideos.length > 10) {
            this.lastCheckedVideos.shift();
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in TikTok check:', error);
    }
  }

  start() {
    // Check immediately
    this.check();
    
    // Then check periodically
    this.intervalId = setInterval(() => {
      this.check();
    }, this.config.tiktok.checkInterval);

    console.log(`✅ TikTok monitor started (checking every ${this.config.tiktok.checkInterval / 1000}s)`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('⛔ TikTok monitor stopped');
    }
  }
}

module.exports = TikTokMonitor;