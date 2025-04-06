const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Yapılandırma Ayarları
const config = {
  cooldown: 3600000, // 1 saat
  channels: {
    manifestLog: '1358448420355837952',
    steamLog: '1358448346108526730'
  },
  keepAlivePort: 8080 // Değiştirebilirsiniz
};

// Keep Alive Sistemi
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Bot Aktif!');
}).listen(config.keepAlivePort);

// Cooldown Sistemi
const cooldowns = new Map();
const usedCodes = new Set();

client.on('ready', () => {
  console.log(`Bot ${client.user.tag} olarak çalışıyor!`);
});

client.on('messageCreate', async message => {
  if (!message.content.startsWith('.fgen') || message.author.bot) return;

  const args = message.content.slice(6).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Cooldown Kontrolü
  if (!cooldowns.has(message.author.id)) {
    cooldowns.set(message.author.id, new Map());
  }

  const now = Date.now();
  const userCooldowns = cooldowns.get(message.author.id);
  const cooldownAmount = config.cooldown;

  if (userCooldowns.has(command)) {
    const expirationTime = userCooldowns.get(command) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000 / 60;
      return message.reply(`Lütfen ${Math.ceil(timeLeft)} dakika sonra tekrar deneyin.`);
    }
  }

  userCooldowns.set(command, now);
  setTimeout(() => userCooldowns.delete(command), cooldownAmount);

  // Komut İşlemleri
  try {
    if (command === 'manifest') {
      await message.author.send('Lütfen Steam AppID\'nizi girin:');
      const filter = m => m.author.id === message.author.id;
      const collector = message.author.dmChannel.createMessageCollector({ filter, time: 60000, max: 1 });

      collector.on('collect', async m => {
        const appId = m.content;
        const logChannel = client.channels.cache.get(config.channels.manifestLog);
        logChannel.send(`Yeni Manifest Talebi:\nKullanıcı: ${message.author.tag}\nAppID: ${appId}`);
        message.author.send('İşleminiz oluşturuldu. Sonuçlar 1-2 iş günü içinde bildirilecektir.');
      });
    }
    else if (command === 'steam') {
      const generatedCode = generateUniqueCode();
      const logChannel = client.channels.cache.get(config.channels.steamLog);
      logChannel.send(`Yeni Steam Talebi:\nKullanıcı: ${message.author.tag}\nKod: ${generatedCode}`);
      message.author.send(`İşleminiz alındı! Hesabınız 1-2 gün içinde hazır olacak.\nTalep Kodunuz: ${generatedCode}`);
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
