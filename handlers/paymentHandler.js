const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');

class PaymentHandler {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    
    this.paymentConfig = {
      gopayMerchantPhone: process.env.GOPAY_MERCHANT_PHONE || '62812345678',
      gopayMerchantName: process.env.GOPAY_MERCHANT_NAME || 'Ottibonynyo',
      // Kita gunakan path lokal sekarang
      qrisLocalPath: path.join(__dirname, '../assets/qris.png'), 
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
    };
  }

  formatCurrency(amount) {
    if (!amount || amount === '0') return 'Custom';
    return new Intl.NumberFormat('id-ID').format(parseInt(amount));
  }

  async handleGopayButton(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#1DB446')
      .setTitle('💚 Gopay')
      .setDescription('Transfer langsung ke nomor GoPay Merchant kami')
      .setThumbnail('https://cdn.worldvectorlogo.com/logos/gopay.svg')
      .addFields(
        {
          name: '📱 Nomor GoPay Merchant',
          value: `\`\`\`${this.paymentConfig.gopayMerchantPhone}\`\`\``,
          inline: false
        },
        {
          name: '🏪 Atas Nama',
          value: this.paymentConfig.gopayMerchantName,
          inline: false
        },
        {
          name: '✅ CARA PEMBAYARAN',
          value: `**1️⃣ Buka Aplikasi GoPay**\n**2️⃣ Pilih Transfer** ke nomor di atas\n**3️⃣ Input Jumlah** yang sesuai\n**4️⃣ Konfirmasi** dan masukkan PIN`,
          inline: false
        }
      )
      .setFooter({ text: 'GoPay Merchant - Pembayaran Instan' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }

  async handleQRISButton(interaction) {
    try {
      // 1. Buat attachment dari file lokal
      const qrisAttachment = new AttachmentBuilder(this.paymentConfig.qrisLocalPath, { name: 'qris_payment.png' });

      const embed = new EmbedBuilder()
        .setColor('#4A90E2')
        .setTitle('📱 QRIS Merchant')
        .setDescription('Scan QRIS dengan e-wallet apapun (GoPay, OVO, Dana, LinkAja, dll)')
        .addFields(
          {
            name: '🎯 QR Code - Scan Sekarang',
            value: 'Arahkan kamera smartphone ke gambar di bawah',
            inline: false
          },
          {
            name: '✅ CARA PEMBAYARAN',
            value: `**1️⃣ Buka E-wallet** pilihanmu\n**2️⃣ Pilih "Scan QRIS"**\n**3️⃣ Arahkan Kamera** ke gambar ini\n**4️⃣ Bayar** & masukkan PIN`,
            inline: false
          }
        )
        // 2. Gunakan syntax attachment:// untuk menampilkan gambar di embed
        .setImage('attachment://qris_payment.png')
        .setFooter({ text: 'QRIS Resmi - Scan dengan e-wallet apapun' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        files: [qrisAttachment], // 3. Kirim file sebagai lampiran
        ephemeral: true
      });
    } catch (error) {
      console.error('Error loading QRIS image:', error);
      await interaction.reply({
        content: '❌ Gagal memuat gambar QRIS dari folder assets. Pastikan file "qris.png" ada di dalam folder tersebut.',
        ephemeral: true
      });
    }
  }

  async handleTransferButton(interaction) {
    const accounts = this.paymentConfig.bankAccounts;
    let accountsText = '';
    for (const [key, account] of Object.entries(accounts)) {
      accountsText += `**${account.name}**\n\`\`\`${account.number}\`\`\`\nAtas Nama: ${account.holder}\n\n`;
    }

    const embed = new EmbedBuilder()
      .setColor('#FF9500')
      .setTitle('🏦 Transfer Bank')
      .setDescription('Transfer via rekening bank')
      .addFields(
        {
          name: '🏧 Pilih Rekening Tujuan',
          value: accountsText,
          inline: false
        },
        {
          name: '⏱️ Waktu Proses',
          value: '⏳ 10-15 menit (verifikasi manual)',
          inline: false
        }
      )
      .setFooter({ text: 'Transfer Bank - Lampirkan bukti setelah transfer' })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
}

module.exports = PaymentHandler;
