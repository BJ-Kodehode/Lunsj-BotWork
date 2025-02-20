require('dotenv').config(); // Laster inn miljøvariabler fra .env
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

// Feilsøking: Sjekk om TOKEN er lastet inn
console.log("Bot token:", process.env.TOKEN ? "Lest inn" : "Mangler!");

// Hent miljøvariabler
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;

if (!token || !channelId || !roleId) {
  console.error('Feil: Token, Channel ID eller Role ID mangler! Sjekk .env-filen.');
  process.exit(1);
}

// Opprett en ny Discord-klient
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once("ready", () => {
  console.log("Boten er klar og kjører!");
});

client.login(token)
  .then(() => console.log("Boten er logget inn!"))
  .catch(err => console.error("Kunne ikke logge inn:", err));