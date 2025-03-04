const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Lar boten lese meldingsinnhold
    GatewayIntentBits.GuildMessageReactions // Lar boten fange opp reaksjoner
  ]
});

module.exports = client;
