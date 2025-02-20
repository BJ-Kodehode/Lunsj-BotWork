require('dotenv').config(); // Laster inn miljøvariabler fra .env
require('dotenv').config();
console.log("TOKEN:", process.env.TOKEN ? "Lest inn" : "Mangler!");
console.log("CHANNEL_ID:", process.env.CHANNEL_ID ? "Lest inn" : "Mangler!");
console.log("ROLE_ID:", process.env.ROLE_ID ? "Lest inn" : "Mangler!");
// const channelId = process.env.CHANNEL_ID;
// console.log("Channel ID:", channelId);
console.log("Role ID:", roleId);
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const { sendLunchMessage } = require('./lunchNotifier'); // Sørg for at denne filen eksisterer


// Feilsøking: Sjekk om TOKEN er lastet inn
console.log("Bot token:", process.env.TOKEN ? "Lest inn" : "Mangler!");

// Hent miljøvariabler
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
console.log("Channel ID:", channelId);
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

  cron.schedule("30 11 * * 1-5", async () => {
    console.log("Cron-jobben kjører! Sjekker om lunsjmelding skal sendes...");
    await sendLunchMessage();
  });
  