const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const YouTubeMonitor = require('./monitors/youtubeMonitor');
const TikTokMonitor = require('./monitors/tiktokMonitor');
const ChatResponder = require('./handlers/chatResponder');
const PaymentHandler = require('./handlers/paymentHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Load commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

let youtubeMonitor;
let tiktokMonitor;
let chatResponder;
let paymentHandler;

client.once('ready', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Bot online sebagai ${client.user.tag}`);
  console.log(`🎮 Bot ID: ${client.user.id}`);
  console.log(`${'='.repeat(50)}\n`);
  
  youtubeMonitor = new YouTubeMonitor(client, config);
  tiktokMonitor = new TikTokMonitor(client, config);
  chatResponder = new ChatResponder(client, config);
  paymentHandler = new PaymentHandler(client, config);
  
  console.log('📊 Memulai monitoring YouTube...');
  youtubeMonitor.start();
  
  console.log('📱 Memulai monitoring TikTok...');
  tiktokMonitor.start();
  
  console.log('💬 Chat responder aktif (tanpa prefix)...');
  console.log('💰 Payment handler aktif...');
  console.log('⌘ Slash commands loaded...');
  console.log(`${'='.repeat(50)}\n`);
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  // Handle slash commands
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: '❌ Terjadi error saat menjalankan command',
        ephemeral: true
      });
    }

    return;
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const buttonId = interaction.customId;

    try {
      if (buttonId === 'metode_gopay') {
        await paymentHandler.handleGopayButton(interaction);
      } else if (buttonId === 'metode_qris') {
        await paymentHandler.handleQRISButton(interaction);
      } else if (buttonId === 'metode_transfer') {
        await paymentHandler.handleTransferButton(interaction);
      }
    } catch (error) {
      console.error('❌ Error handling button:', error);
      await interaction.reply({
        content: '❌ Terjadi error',
        ephemeral: true
      });
    }
  }
});

// Handle chat messages (untuk prefix command)
client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot || !message.content.trim()) return;
    
    // Chat monitor - respond to ALL messages
    if (message.channelId === config.discord.channelIds.chatMonitor) {
      const delay = Math.random() * 1000 + config.bot.responseDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`\n💬 [${message.author.username}]: ${message.content}`);
      await chatResponder.respond(message);
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
  }
});

client.on('error', error => {
  console.error('❌ Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

client.login(config.discord.token);

process.on('SIGINT', () => {
  console.log('\n⛔ Bot shutting down...');
  if (youtubeMonitor) youtubeMonitor.stop();
  if (tiktokMonitor) tiktokMonitor.stop();
  client.destroy();
  process.exit(0);
});