const { EmbedBuilder } = require('discord.js');
const NodeCache = require('node-cache');
const Parser = require('rss-parser');

class YouTubeMonitor {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.cache = new NodeCache({ stdTTL: 600 });
    this.lastCheckedVideos = [];
    this.intervalId = null;
    this.parser = new Parser();
  }

  // Extract channel ID dari URL
  extractChannelId(url) {
    try {
      // Format: https://youtube.com/@ottibonynyo
      const match = url.match(/@([a-zA-Z0-9_-]+)/);
      if (match) {
        return match[1];
      }
      // Format: youtube.com/channel/UCxxxxxx
      const channelMatch = url.match(/channel\/(UC[a-zA-Z0-9_-]+)/);
      if (channelMatch) {
        return channelMatch[1];
      }
      return null;
    } catch (error) {
      console.error('❌ Error extracting channel ID:', error);
      return null;
    }
  }

  // Get channel ID dari handle (menggunakan scraping sederhana)
  async getChannelIdFromHandle(handle) {
    try {
      const axios = require('axios');
      
      // Coba RSS feed dengan handle
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?user=${handle}`;
      
      try {
        await this.parser.parseURL(rssUrl);
        console.log(`✅ Found RSS for user: ${handle}`);
        return { type: 'user', value: handle };
      } catch (e) {
        // Jika user tidak ketemu, coba sebagai channel
        const rssUrlChannel = `https://www.youtube.com/feeds/videos.xml?channel_id=${handle}`;
        try {
          await this.parser.parseURL(rssUrlChannel);
          console.log(`✅ Found RSS for channel: ${handle}`);
          return { type: 'channel', value: handle };
        } catch (e2) {
          console.log(`⚠️ Cannot find ${handle} on YouTube`);
          return null;
        }
      }
    } catch (error) {
      console.error('❌ Error getting channel ID:', error);
      return null;
    }
  }

  // Get latest videos dari RSS feed
  async getLatestVideos() {
    try {
      const channelHandle = this.extractChannelId(this.config.youtube.channelUrl);
      
      if (!channelHandle) {
        console.error('❌ Cannot extract channel handle from URL');
        return [];
      }

      console.log(`📺 Checking YouTube: ${channelHandle}`);

      // RSS feed URLs
      const rssUrls = [
        `https://www.youtube.com/feeds/videos.xml?user=${channelHandle}`,
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channelHandle}`
      ];

      let feed = null;
      
      for (const rssUrl of rssUrls) {
        try {
          feed = await this.parser.parseURL(rssUrl);
          console.log(`✅ RSS feed found for: ${channelHandle}`);
          break;
        } catch (e) {
          // Try next URL
        }
      }

      if (!feed || !feed.items) {
        console.log(`⚠️ No videos found for: ${channelHandle}`);
        return [];
      }

      // Extract video info
      const videos = feed.items.slice(0, 5).map(item => ({
        id: item.id || item.link,
        title: item.title,
        description: item.contentSnippet || item.description || 'No description',
        url: item.link,
        thumbnail: item.media?.thumbnail?.[0]?.url || this.getYouTubeThumbnail(item.link),
        publishedAt: item.pubDate || new Date().toISOString(),
        author: feed.title || 'Unknown Channel'
      }));

      return videos;

    } catch (error) {
      console.error('❌ Error getting YouTube videos:', error.message);
      return [];
    }
  }

  // Extract thumbnail dari YouTube URL
  getYouTubeThumbnail(url) {
    try {
      const videoId = url.match(/v=([a-zA-Z0-9_-]+)/)?.[1];
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
      return 'https://www.youtube.com/favicon.ico';
    } catch (e) {
      return 'https://www.youtube.com/favicon.ico';
    }
  }

  async postVideo(video) {
    try {
      const channel = await this.client.channels.fetch(
        this.config.discord.channelIds.youtubePost
      );

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎥 Video YouTube Baru!')
        .setDescription(video.title)
        .setURL(video.url)
        .setImage(video.thumbnail)
        .addFields(
          {
            name: '📺 Channel',
            value: video.author,
            inline: true
          },
          {
            name: '⏰ Published',
            value: new Date(video.publishedAt).toLocaleString('id-ID'),
            inline: true
          }
        )
        .setFooter({ text: 'YouTube' })
        .setTimestamp();

      await channel.send({
        embeds: [embed],
        content: `🎬 **${video.title}**\n🔗 ${video.url}`
      });

      console.log(`✅ Posted YouTube video: ${video.title}`);
      return true;

    } catch (error) {
      console.error('❌ Error posting YouTube video:', error);
      return false;
    }
  }

  async check() {
    try {
      const videos = await this.getLatestVideos();
      
      if (videos.length === 0) {
        console.log('ℹ️  No new videos found');
        return;
      }

      for (const video of videos) {
        // Check apakah video sudah pernah dipost
        if (!this.lastCheckedVideos.includes(video.id)) {
          const posted = await this.postVideo(video);
          
          if (posted) {
            this.lastCheckedVideos.push(video.id);
            
            // Keep only last 20 videos in memory
            if (this.lastCheckedVideos.length > 20) {
              this.lastCheckedVideos.shift();
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ Error in YouTube check:', error);
    }
  }

  start() {
    console.log(`⏳ YouTube monitoring will check every ${this.config.youtube.checkInterval / 1000} seconds`);
    
    // Check immediately
    this.check();
    
    // Then check periodically
    this.intervalId = setInterval(() => {
      this.check();
    }, this.config.youtube.checkInterval);

    console.log(`✅ YouTube monitor started`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('⛔ YouTube monitor stopped');
    }
  }
}

module.exports = YouTubeMonitor;