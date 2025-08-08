require('dotenv').config(); // Laster inn miljøvariabler fra .env

const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

// Hent miljøvariabler
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;

// Logg etter at variablene er definert
console.log("TOKEN:", token ? "Lest inn" : "Mangler!");
console.log("CHANNEL_ID:", channelId ? "Lest inn" : "Mangler!");
console.log("ROLE_ID:", roleId ? "Lest inn" : "Mangler!");

if (!token || !channelId || !roleId) {
  console.error('Feil: Token, Channel ID eller Role ID mangler! Sjekk .env-filen.');
  process.exit(1);
}

const config = require('./config');
console.log("Timezone:", config.timezone);



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

  const { getCurrentOsloTime } = require('./timeUtils');


  // Cron-jobben som kjører på spesifisert tid (eks. 11:30)
  cron.schedule("30 11 * * 1-5", async () => {
    console.log("Cron-jobben kjører! Sjekker om lunsjmelding skal sendes...");
    const osloTime = await getCurrentOsloTime();
    if (!osloTime) {
      console.error("Kunne ikke hente Oslo-tid. Avbryter lunsjmelding.");
      return;
    }
    console.log(`Nåværende tid i Oslo: ${osloTime.time}`);
    await sendLunchMessage();
  });
  

