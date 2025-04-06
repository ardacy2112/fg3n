const { Client, GatewayIntentBits, Collection } = require('discord.js');
const cooldowns = new Map();
const usedCodes = new Set();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Kanal ID'lerini buraya girin
const config = {
  manifestLog: '1358448420355837952',
  steamLog: '1358448346108526730',
  cooldown: 3600000 // 1 saat milisaniye cinsinden
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('.fgen') || message.author.bot) return;

  const args = message.content.slice(6).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Cooldown kontrolü
  if (!cooldowns.has(message.author.id)) {
    cooldowns.set(message.author.id, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(message.author.id);
  const cooldownAmount = config.cooldown;

  if (timestamps.has(command)) {
    const expirationTime = timestamps.get(command) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000 / 60;
      return message.reply(`Lütfen ${Math.ceil(timeLeft)} dakika sonra tekrar deneyin.`);
    }
  }

  timestamps.set(command, now);
  setTimeout(() => timestamps.delete(command), cooldownAmount);

  // Komut işlemleri
  try {
    if (command === 'manifest') {
      await message.author.send('Lütfen Steam AppID\'nizi girin:');
      const filter = m => m.author.id === message.author.id;
      const collector = message.author.dmChannel.createMessageCollector({ filter, time: 60000, max: 1 });

      collector.on('collect', async m => {
        const appId = m.content;
        const logChannel = client.channels.cache.get(config.manifestLog);
        logChannel.send(`Yeni Manifest Talebi:\nKullanıcı: ${message.author.tag}\nAppID: ${appId}`);
        message.author.send('İşleminiz oluşturuldu. Sonuçlar 1-2 iş günü içinde bildirilecektir.');
      });
    } 
    else if (command === 'steam') {
      const generatedCode = generateUniqueCode();
      const logChannel = client.channels.cache.get(config.steamLog);
      logChannel.send(`Yeni Steam Talebi:\nKullanıcı: ${message.author.tag}\nKod: ${generatedCode}`);
      message.author.send(`İşleminiz alındı! Hesabınız 1-2 gün içinde hazır olacak.\nTalep Kodunuz: ${generatedCode}\nLütfen bu kodla ticket açın.`);
    }
  } catch (error) {
    console.error('Hata:', error);
    message.channel.send('DM gönderilemedi. Lütfen DM ayarlarınızı kontrol edin.');
  }
});

function generateUniqueCode() {
  let code;
  do {
    code = Math.random().toString(36).substr(2, 8).toUpperCase();
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
}

client.login(process.env.TOKEN);
