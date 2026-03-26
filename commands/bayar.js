const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config'); // Pastikan path ke config.js benar

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bayar')
    .setDescription('Lihat metode pembayaran tersedia')
    .addIntegerOption(option =>
      option
        .setName('jumlah')
        .setDescription('Jumlah pembayaran (opsional)')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    try {
      // --- PENGECEKAN USER ID ---
      // Hanya User ID yang terdaftar di OWNER_ID pada .env yang bisa menggunakan ini
      if (interaction.user.id !== config.discord.ownerId) {
        return interaction.reply({
          content: '❌ Maaf, perintah ini hanya dapat digunakan oleh Administrator/Owner.',
          flags: 64 // Ephemeral: hanya user tersebut yang bisa lihat pesan penolakan ini
        });
      }
      // ---------------------------

      const amount = interaction.options.getInteger('jumlah');
      
      const embed = new EmbedBuilder()
        .setColor('#1DB446')
        .setTitle('💰 Metode Pembayaran')
        .setDescription(amount ? `Pembayaran: Rp ${new Intl.NumberFormat('id-ID').format(amount)}` : 'Pilih metode pembayaran yang Anda inginkan')
        .addFields(
          {
            name: '💚 Gopay',
            value: 'Transfer langsung ke nomor GoPay merchant\n⚡ Instan',
            inline: false
          },
          {
            name: '📱 QRIS',
            value: 'Scan QRIS dengan e-wallet apapun\n⚡ Instan',
            inline: false
          },
          {
            name: '🏦 Transfer Bank',
            value: 'Transfer via rekening bank\n⏳ 10-15 menit',
            inline: false
          }
        )
        .setFooter({ text: 'Klik tombol di bawah untuk memilih metode' })
        .setTimestamp();

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('metode_gopay')
            .setLabel('Gopay')
            .setStyle(ButtonStyle.Success)
            .setEmoji('💚'),
          new ButtonBuilder()
            .setCustomId('metode_qris')
            .setLabel('QRIS')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📱'),
          new ButtonBuilder()
            .setCustomId('metode_transfer')
            .setLabel('Transfer Bank')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏦')
        );

      await interaction.reply({
        embeds: [embed],
        components: [buttons],
        flags: 64
      });

      console.log(`📲 Payment menu opened by ${interaction.user.username}`);

    } catch (error) {
      console.error('❌ Error in /bayar command:', error);
      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ Terjadi error saat membuka menu pembayaran',
          flags: 64
        });
      }
    }
  }
};
