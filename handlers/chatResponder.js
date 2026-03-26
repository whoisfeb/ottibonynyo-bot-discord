const ContentSearcher = require('./contentSearcher');

class ChatResponder {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.contentSearcher = new ContentSearcher(client, config);
    
    // Pesan tambahan (Reminder)
    this.reminderText = "\n\n⚠️ **Pengingat:** Jangan lupa req <@&1486252469485961336> di <#1486252838186127360> agar bisa mengakses atau mendapatkan mod special dari ottibonynyo store <#1466660218686668894>";

    this.responseTemplates = {
      greeting: [
        'Halo! 👋 Ada yang bisa dibantu?',
        'Hi! 😊 Apa ada yang ingin ditanyakan?',
        'Halo kak! 👋 Gimana kabarnya?'
      ],
      question: [
        'Pertanyaan yang bagus! 🤔',
        'Menarik banget pertanyaannya! 💡',
        'Mari kita cari jawabannya! 🔍'
      ],
      notification: [
        '⚠️ Ada pertanyaan nih!',
        '📢 Ada yang perlu dibantu!',
        '🔔 Ada chat masuk!'
      ]
    };
  }

  getRandomTemplate(type) {
    const templates = this.responseTemplates[type] || this.responseTemplates.question;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async respond(message) {
    try {
      const guild = message.guild;
      const userMessage = message.content.trim();

      console.log(`❓ Processing: ${userMessage}`);

      const relevantChannels = await this.contentSearcher.searchAllChannels(
        guild,
        userMessage
      );

      let finalResponse = "";

      if (relevantChannels && relevantChannels.length > 0) {
        // ✅ Channel ditemukan (Format Text)
        const channelList = relevantChannels
          .map((item, index) => {
            const scoreBar = this.getScoreBar(item.score);
            return `${index + 1}. ${item.channel.toString()} ${scoreBar} (${item.score} pts)`;
          })
          .join('\n');

        finalResponse = `✅ **Channel(s) Ditemukan!**\n` +
                        `${this.getRandomTemplate('question')} Sepertinya pertanyaanmu cocok dengan channel-channel ini:\n\n` +
                        `📌 **Channel Terkait:**\n${channelList}\n\n` +
                        `💡 **Tips:** Cek channel di atas untuk info lebih lanjut! Jika masih bingung, tunggu respon dari <@${this.config.discord.ownerId}>.`;
      } else {
        // ❌ Channel tidak ditemukan (Format Text)
        const ownerId = this.config.discord.ownerId;
        
        finalResponse = `❓ **Hmm, Sulit Diketahui...**\n` +
                        `${this.getRandomTemplate('notification')} Pertanyaanmu tidak cocok dengan channel manapun di server.\n\n` +
                        `**jika ada yang tidak anda pahami silahkan tunggu respon dari** <@${ownerId}> !`;
      }

      // Gabungkan dengan reminder
      await message.reply({
        content: finalResponse + this.reminderText,
        allowedMentions: { repliedUser: false, parse: ['users', 'roles'] }
      });

    } catch (error) {
      console.error('❌ Error in chatResponder:', error);
      try {
        await message.reply({
          content: '❌ Terjadi error saat memproses pertanyaanmu. Owner akan segera membantu!' + this.reminderText,
          allowedMentions: { repliedUser: false }
        });
      } catch (e) {
        console.error('❌ Error sending error message:', e);
      }
    }
  }

  getScoreBar(score) {
    const maxScore = 20;
    const filledBars = Math.max(0, Math.min(5, Math.round((score / maxScore) * 5)));
    const emptyBars = 5 - filledBars;
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  }
}

module.exports = ChatResponder;
