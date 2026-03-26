const QRCode = require('qrcode');

class QRISGenerator {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.merchantPhone = process.env.GOPAY_MERCHANT_PHONE || '62812345678';
  }

  /**
   * Generate Dynamic QRIS dengan jumlah custom
   * Menggunakan format GoPay Merchant
   */
  generateQRISString(amount, merchantName = 'Ottibonynyo', merchantCity = 'Indonesia') {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Jumlah tidak valid');
      }

      // Build QRIS dengan EMV format yang compatible dengan GoPay
      const qrisCode = this.buildDynamicQRIS(amount, merchantName, merchantCity);
      return qrisCode;

    } catch (error) {
      console.error('❌ Error generating QRIS:', error);
      return null;
    }
  }

  /**
   * Build Dynamic QRIS untuk GoPay
   */
  buildDynamicQRIS(amount, merchantName, merchantCity) {
    try {
      let qris = '';

      // Point of Initiation Method
      qris += '000201';

      // Merchant Account Information (Tag 26)
      const merchantInfo = this.buildMerchantInfo();
      qris += '26' + this.padLength(merchantInfo.length) + merchantInfo;

      // Merchant Category Code (Tag 52)
      const mcc = '5411'; // Retail
      qris += '5204' + mcc;

      // Transaction Currency (Tag 53) - IDR
      qris += '530336';

      // Transaction Amount (Tag 54) - DYNAMIC
      const amountStr = Math.round(amount).toString();
      qris += '54' + this.padLength(amountStr.length) + amountStr;

      // Merchant Name (Tag 59)
      const nameBytes = Buffer.from(merchantName, 'utf-8');
      qris += '59' + this.padLength(nameBytes.length) + merchantName;

      // Merchant City (Tag 60)
      const cityBytes = Buffer.from(merchantCity, 'utf-8');
      qris += '60' + this.padLength(cityBytes.length) + merchantCity;

      // Additional Data (Tag 62) - Invoice Reference
      const invoiceId = this.generateInvoiceId();
      qris += '6209' + '0' + this.padLength(invoiceId.length) + invoiceId;

      // CRC Checksum (Tag 63)
      const checksum = this.calculateCRC(qris);
      qris += '6304' + checksum;

      return qris;

    } catch (error) {
      console.error('❌ Error building Dynamic QRIS:', error);
      return null;
    }
  }

  /**
   * Build Merchant Account Information
   */
  buildMerchantInfo() {
    // GoPay GUI (Global Unique Identifier)
    const gui = '000007ID5N0010A000000677608090512';
    
    // Merchant account info (nomor GoPay)
    const accountInfo = this.merchantPhone;
    
    let info = '';
    info += '00' + this.padLength(gui.length) + gui;
    info += '01' + this.padLength(accountInfo.length) + accountInfo;
    
    return info;
  }

  /**
   * Pad length ke 2 digit
   */
  padLength(length) {
    const len = length.toString();
    return len.length === 1 ? '0' + len : len;
  }

  /**
   * Calculate CRC-16 checksum
   */
  calculateCRC(qrisString) {
    let crc = 0xFFFF;
    
    for (let i = 0; i < qrisString.length; i += 2) {
      const byte = parseInt(qrisString.substr(i, 2), 16);
      crc ^= (byte << 8);
      
      for (let j = 0; j < 8; j++) {
        crc <<= 1;
        if ((crc & 0x10000) !== 0) {
          crc ^= 0x1021;
        }
      }
    }
    
    return ((crc & 0xFFFF) ^ 0xFFFF).toString(16).padStart(4, '0').toUpperCase();
  }

  /**
   * Generate Invoice ID unik
   */
  generateInvoiceId() {
    return `OTI${Date.now()}`.substring(0, 12);
  }

  /**
   * Generate QR Code sebagai Buffer
   */
  async generateQRCodeBuffer(qrisString) {
    try {
      if (!qrisString) {
        throw new Error('QRIS string tidak valid');
      }

      const buffer = await QRCode.toBuffer(qrisString, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return buffer;

    } catch (error) {
      console.error('❌ Error generating QR code buffer:', error);
      return null;
    }
  }

  /**
   * Send Dynamic QRIS ke Discord
   */
  async sendDynamicQRIS(interaction, amount) {
    try {
      // Generate QRIS dengan amount
      const qrisString = this.generateQRISString(
        amount,
        'Ottibonynyo Community Hub',
        'Indonesia'
      );

      if (!qrisString) {
        throw new Error('Gagal generate QRIS');
      }

      // Generate QR code image
      const qrBuffer = await this.generateQRCodeBuffer(qrisString);

      if (!qrBuffer) {
        throw new Error('Gagal generate QR code image');
      }

      const formattedAmount = new Intl.NumberFormat('id-ID').format(amount);

      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setColor('#4A90E2')
        .setTitle('📱 QRIS Dinamis - GoPay Merchant')
        .setDescription(`**Jumlah:** Rp ${formattedAmount}`)
        .addFields(
          {
            name: '🎯 QR Code',
            value: 'Scan QR code di bawah dengan e-wallet apapun',
            inline: false
          },
          {
            name: '✅ Keuntungan QRIS Dinamis',
            value: '• Jumlah OTOMATIS sesuai permintaan\n• Berlaku untuk semua e-wallet\n• Transfer instan tanpa biaya admin\n• Dari GoPay Merchant resmi',
            inline: false
          },
          {
            name: '💬 Cara Pembayaran',
            value: `1️⃣ Buka aplikasi pembayaran (GoPay, OVO, Dana, LinkAja, dll)\n2️⃣ Pilih "Scan QRIS" atau "Bayar QRIS"\n3️⃣ Arahkan kamera ke QR Code di atas\n4️⃣ Jumlah **Rp ${formattedAmount}** SUDAH TERISI OTOMATIS\n5️⃣ Tekan "Bayar" untuk konfirmasi\n6️⃣ Selesai! Pembayaran berhasil`,
            inline: false
          },
          {
            name: '📱 Aplikasi Support QRIS',
            value: '• 💚 GoPay\n• 🟣 OVO\n• 🔵 Dana\n• 🟠 LinkAja\n• Dan e-wallet lainnya',
            inline: false
          },
          {
            name: '⏰ Batas Waktu',
            value: 'Pembayaran harus selesai dalam **15 menit**',
            inline: false
          },
          {
            name: '🔐 Info Transaksi',
            value: `ID: \`OTI${Date.now()}\`\nJumlah: Rp ${formattedAmount}\nWaktu: ${new Date().toLocaleString('id-ID')}`,
            inline: false
          }
        )
        .setImage('attachment://qris.png')
        .setFooter({ text: 'Pembayaran akan diverifikasi otomatis setelah transfer' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        files: [
          {
            attachment: qrBuffer,
            name: 'qris.png'
          }
        ],
        ephemeral: true
      });

      console.log(`✅ Dynamic QRIS generated for Rp ${formattedAmount}`);

    } catch (error) {
      console.error('❌ Error sending dynamic QRIS:', error);
      
      try {
        await interaction.reply({
          content: '❌ Gagal generate QRIS. Silakan hubungi owner.',
          ephemeral: true
        });
      } catch (e) {
        console.error('❌ Error:', e);
      }
    }
  }

  /**
   * Validate QRIS string
   */
  validateQRIS(qrisString) {
    if (!qrisString || typeof qrisString !== 'string') {
      return false;
    }

    if (!qrisString.startsWith('000201')) {
      return false;
    }

    if (!qrisString.includes('63')) {
      return false;
    }

    return true;
  }

  /**
   * Parse QRIS string untuk get info
   */
  parseQRIS(qrisString) {
    try {
      const info = {
        valid: this.validateQRIS(qrisString),
        qrisString: qrisString,
        length: qrisString.length
      };

      const amountMatch = qrisString.match(/54(\d{2})(\d+)/);
      if (amountMatch) {
        info.amount = parseInt(amountMatch[2]);
      }

      return info;
    } catch (error) {
      console.error('❌ Error parsing QRIS:', error);
      return null;
    }
  }
}

module.exports = QRISGenerator;