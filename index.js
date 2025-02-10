require('dotenv').config(); // Laster inn miljøvariabler fra .env
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

// Hent token, channelId og roleId fra miljøvariabler
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;

// Debugging: Sjekk om variablene blir hentet riktig
console.log("Token:", token);
console.log("Channel ID:", channelId);
console.log("Role ID:", roleId);

if (!token || !channelId || !roleId) {
  console.error('Feil: Token, Channel ID eller Role ID mangler! Sjekk at .env-filen er riktig konfigurert.');
  process.exit(1); // Stopper programmet hvis en av variablene mangler
} else {
  console.log('Token funnet:', token.substring(0, 5) + '... (skjult resten for sikkerhet)');
  console.log('Channel ID og Role ID er også lastet riktig.');
}

// Opprett en ny Discord-klient
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Sett opp tidsplanen for lunsjvarsling - her setter vi lunsj til å være klokken 11:30 mandag til fredag
cron.schedule('30 11 * * 1-5', () => {
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    // Send en melding og tag gruppen "tech" med rollen
    channel.send(`<@&${roleId}> Det er på tide for lunsj! 🍽️`)
      .then(() => console.log('Lunsjvarsling sendt!'))
      .catch(err => console.error('Kunne ikke sende melding:', err));
  } else {
    console.log('Fant ikke kanalen.');
  }
});

// Logg inn til Discord-boten
client.login(token)
  .then(() => console.log('Boten er logget inn!'))
  .catch(err => console.error('Kunne ikke logge inn:', err));

// Når boten er klar
client.once('ready', () => {
  console.log('Boten er klar og kjører!');
});
