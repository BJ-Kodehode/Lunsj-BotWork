// Importerer nødvendige klasser og konstanter fra discord.js-biblioteket
const { Client, GatewayIntentBits } = require('discord.js');

// Oppretter en ny Discord-klient med spesifikke intensjoner (permissions)
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,         // Tillater tilgang til informasjon om servere (guilds)
    GatewayIntentBits.GuildMessages   // Tillater lesing og håndtering av meldinger i serverkanaler
  ]
});

// Eksporterer klienten slik at den kan brukes i andre moduler
module.exports = client;
