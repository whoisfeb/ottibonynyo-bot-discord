const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// PENTING: Segera RESET TOKEN ANDA di Developer Portal karena sudah terekspos publik!
const TOKEN = 'MTQ4NjE4NzM3MTQ3NjAyOTYxMA.GKa1dk.5aAobBOioOLyOi2uonxBcylOxPx2gk41dUnUUk';
const CLIENT_ID = '1486187371476029610';

// 1. Registrasi Slash Command
const commands = [
    new SlashCommandBuilder()
        .setName('ofclink')
        .setDescription('Menampilkan Hub Link Resmi Ottibonynyo')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Slash Command Terdaftar!');
    } catch (error) { console.error(error); }
})();

// 2. Logika Command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ofclink') {
        const spc = ' '; // Spasi khusus agar tombol lebar

        // BARIS 1: Community Official Links
        const rowCommunity = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(`${spc}YouTube Community${spc}`)
                    .setEmoji('👥')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://youtube.com/@ottibonynyo?si=4vKORN7RUiGRKMkt'),
                new ButtonBuilder()
                    .setLabel(`${spc}TikTok Community${spc}`)
                    .setEmoji('📱')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://www.tiktok.com/@ottibonynyocommunity?_r=1&_t=ZS-94yTFOiSgcO'),
                new ButtonBuilder()
                    .setLabel(`${spc}Discord Server${spc}`)
                    .setEmoji('🌐')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/UYNAjCHDMj'),
            );

        // BARIS 2: Admin Links (Silakan ganti URL link admin di bawah)
        const rowAdmin = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel(`${spc}YouTube Admin${spc}`)
                    .setEmoji('🔴')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://youtube.com/@kennthlowelll?si=QsB3leB9lxKqtBPX'), // GANTI LINK INI
                new ButtonBuilder()
                    .setLabel(`${spc}TikTok Admin${spc}`)
                    .setEmoji('⚫')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://www.tiktok.com/@leav1ngsomeone?is_from_webapp=1&sender_device=pc'), // GANTI LINK INI
            );

        // Header Pesan yang Elegan & Minimalis
        const messageContent = 
            `### 🔗 **OTTIBONYNYO OFFICIAL HUB**\n` +
            `*Pusat informasi dan koneksi resmi komunitas & manajemen.*\n` +
            `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯`;

        await interaction.reply({ 
            content: messageContent, 
            components: [rowCommunity, rowAdmin] 
        });
    }
});

client.login(TOKEN);
