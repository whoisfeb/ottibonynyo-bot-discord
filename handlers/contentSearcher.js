const NodeCache = require('node-cache');

class ContentSearcher {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache 1 jam
  }

  extractKeywords(text) {
    // Hapus punctuation dan convert ke lowercase
    const cleaned = text.toLowerCase()
      .replace(/[.,!?;:'"()-]/g, '')
      .trim();
    
    return cleaned.split(/\s+/).filter(word => word.length > 2);
  }

  calculateSimilarity(keywords, channelName) {
    const channelKeywords = this.extractKeywords(channelName);
    let score = 0;

    for (const keyword of keywords) {
      for (const channelKeyword of channelKeywords) {
        // Exact match - highest score
        if (channelKeyword === keyword) {
          score += 5;
        }
        // Partial match
        else if (channelKeyword.includes(keyword) || keyword.includes(channelKeyword)) {
          score += 3;
        }
        // Similarity check
        else if (this.isSimilar(keyword, channelKeyword)) {
          score += 1;
        }
      }
    }

    return score;
  }

  isSimilar(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return true;
    
    const editDistance = this.getEditDistance(longer, shorter);
    return editDistance <= longer.length * 0.4;
  }

  getEditDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  // ⭐ METHOD BARU - CARI SEMUA CHANNEL YANG RELEVAN
  async searchAllChannels(guild, query) {
    try {
      const keywords = this.extractKeywords(query);
      const channelResults = [];

      // Get all channels
      const channels = await guild.channels.fetch();

      for (const [, channel] of channels) {
        // Skip voice channels, category, threads
        if (!channel.isTextBased() || channel.isThread()) continue;

        const score = this.calculateSimilarity(keywords, channel.name);

        // Hanya include channel dengan score > 3
        if (score > 0) {
          channelResults.push({
            channel: channel,
            score: score
          });
        }
      }

      // Sort by score (tertinggi dulu)
      channelResults.sort((a, b) => b.score - a.score);

      // Return top 5 channels
      const topChannels = channelResults.slice(0, 5);

      if (topChannels.length > 0) {
        console.log(`✅ Found ${topChannels.length} matching channels:`);
        topChannels.forEach(item => {
          console.log(`   - ${item.channel.name} (score: ${item.score})`);
        });
      } else {
        console.log(`❌ No matching channels found`);
      }

      return topChannels;
    } catch (error) {
      console.error('❌ Error searching channels:', error);
      return [];
    }
  }

  // METHOD LAMA - UNTUK KOMPATIBILITAS
  async searchChannel(guild, query) {
    try {
      const topChannels = await this.searchAllChannels(guild, query);
      return topChannels.length > 0 ? topChannels[0].channel : null;
    } catch (error) {
      console.error('❌ Error in searchChannel:', error);
      return null;
    }
  }
}

module.exports = ContentSearcher;