const { Client, GatewayIntentBits, AttachmentBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');
const QRCode = require('qrcode');

// --- KONFIGURASI ---
const TOKEN = 'MTQ4NjE4NzM3MTQ3NjAyOTYxMA.GKa1dk.5aAobBOioOLyOi2uonxBcylOxPx2gk41dUnUUk';
const CLIENT_ID = '1486187371476029610';
// Teks QRIS Statis dari gambar yang Anda kirim tadi (tanpa CRC16 di akhir)
const QRIS_BASE = '00020101021126620015ID.CO.GOPAY.WWW01189360001025467875410215ID10202612297660303A0151440014ID.CO.QRIS.WWW0215ID10202612297660303A015204000053033605802ID5925OTTIBONYNYO COMMUNITY HUB6010KOTA BEKASI610517112';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Fungsi Manual Generate QRIS Dinamis (Pasti Berhasil)
function generateQRISDinamis(statis, nominal) {
    let qris = statis.replace("010211", "010212"); // Ubah status jadi Dinamis
    let dataNominal = "54" + String(nominal.toString().length).padStart(2, '0') + nominal;
    
    // Pecah string sebelum CRC16 (6304)
    let qrisFix = qris.split("6304")[0] + dataNominal + "6304";
    
    // Hitung CRC16
    let crc = 0xFFFF;
    for (let i = 0; i < qrisFix.length; i++) {
        crc ^= qrisFix.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
        }
    }
    crc = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return qrisFix + crc;
}

// Registrasi Slash Command
const commands = [
    new SlashCommandBuilder()
        .setName('bayar')
        .setDescription('Generate QRIS Nominal')
        .addIntegerOption(opt => opt.setName('jumlah').setDescription('Nominal uang').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Command /bayar terdaftar!');
    } catch (e) { console.error(e); }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'bayar') {
        const nominal = interaction.options.getInteger('jumlah');
        await interaction.deferReply();

        try {
            const finalQRIS = generateQRISDinamis(QRIS_BASE, nominal);
            const qrBuffer = await QRCode.toBuffer(finalQRIS, { margin: 2, width: 400 });
            const attachment = new AttachmentBuilder(qrBuffer, { name: `qris-${nominal}.png` });

            await interaction.editReply({ 
                content: `✅ **QRIS BERHASIL**\nNominal: **Rp${nominal.toLocaleString('id-ID')}**`, 
                files: [attachment] 
            });
        } catch (err) {
            console.error(err);
            await interaction.editReply("❌ Error sistem!");
        }
    }
});

client.login(TOKEN);
