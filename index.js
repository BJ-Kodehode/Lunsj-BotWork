require('dotenv').config(); // Laster inn miljøvariabler fra .env
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fetch = require('node-fetch'); // Sørg for at du har installert denne pakken

// Hent miljøvariabler
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;
const TIME_API_URL = "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Oslo";
const HOLIDAY_API_URL = "https://date.nager.at/Api/v2/PublicHolidays";

// Debugging: Sjekk om variablene blir hentet riktig
if (!token || !channelId || !roleId) {
  console.error('Feil: Token, Channel ID eller Role ID mangler! Sjekk at .env-filen er riktig konfigurert.');
  process.exit(1);
}

// Opprett en ny Discord-klient
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Funksjon for å hente nåværende dato og tid fra Time API
async function getCurrentOsloTime() {
  try {
    const response = await fetch(TIME_API_URL);
    const data = await response.json();
    return data; // Inneholder { date, time, timeZone, dayOfWeek }
  } catch (error) {
    console.error("Feil ved henting av tid fra Time API:", error);
    return null;
  }
}

// Funksjon for å sjekke om det er en rød dag i Norge
async function isPublicHoliday() {
  try {
    const currentYear = new Date().getFullYear();
    const response = await fetch(`${HOLIDAY_API_URL}/${currentYear}/NO`);
    const holidays = await response.json();
    
    // Få dagens dato i formatet YYYY-MM-DD
    const today = (await getCurrentOsloTime()).date;

    // Sjekk om dagens dato finnes i listen over helligdager
    return holidays.some(holiday => holiday.date === today);
  } catch (error) {
    console.error("Feil ved henting av helligdager:", error);
    return false;
  }
}

// Funksjon for å sende lunsjmelding hvis det ikke er helg eller helligdag
async function sendLunchMessage() {
  const osloTime = await getCurrentOsloTime();
  if (!osloTime) return;

  const today = osloTime.date; // YYYY-MM-DD
  const dayOfWeek = osloTime.dayOfWeek; // "Monday", "Tuesday", etc.

  if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
    console.log("Det er helg, ingen varsling sendes.");
    return;
  }

  const holiday = await isPublicHoliday();
  if (holiday) {
    console.log("Det er en helligdag, ingen varsling sendes.");
    return;
  }

  // Send melding hvis det ikke er helg eller helligdag
  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send(`<@&${roleId}> Det er på tide for lunsj! 🍽️`)
      .then(() => console.log(`Lunsjvarsling sendt kl. ${osloTime.time}`))
      .catch(err => console.error("Kunne ikke sende melding:", err));
  } else {
    console.log("Fant ikke kanalen.");
  }
}

// Sett opp cron-jobb for lunsjmelding kl 11:30 Oslo-tid
cron.schedule("30 10 * * 1-5", async () => { // 10:30 UTC = 11:30 Oslo tid
  console.log("Sjekker om lunsjmelding skal sendes...");
  await sendLunchMessage();
});

// Logg inn til Discord-boten
client.login(token)
  .then(() => console.log("Boten er logget inn!"))
  .catch(err => console.error("Kunne ikke logge inn:", err));

client.once("ready", () => {
  console.log("Boten er klar og kjører!");
});
