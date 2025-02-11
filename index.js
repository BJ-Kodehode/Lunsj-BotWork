require('dotenv').config(); // Laster inn miljøvariabler fra .env
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

// Sjekk om fetch er tilgjengelig i den nåværende versjonen av Node.js
let fetch;

if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;  // Bruk den innebygde fetch (Node.js 17.5+)
} else {
  fetch = require('node-fetch');  // Bruk node-fetch for eldre versjoner
}

// Hent miljøvariabler
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;

const TIME_API_URL = "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Oslo";
const HOLIDAY_API_URL = "https://date.nager.at/Api/v2/PublicHolidays";
const HOLIDAY_FILE = "holidays.json";

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

// Funksjon for å hente og lagre helligdager
async function fetchAndStoreHolidays() {
  try {
    const currentYear = new Date().getFullYear();
    
    // Sjekk om filen eksisterer og allerede har data for inneværende år
    if (fs.existsSync(HOLIDAY_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(HOLIDAY_FILE, "utf8"));
      if (fileData.year === currentYear) {
        console.log("Helligdager er allerede oppdatert for dette året.");
        return fileData.dates;
      }
    }

    // Hent helligdager fra API-et
    const response = await fetch(`${HOLIDAY_API_URL}/${currentYear}/NO`);
    const holidays = await response.json();
    
    // Konverter til en liste med datoer
    const holidayDates = holidays.map(holiday => holiday.date);

    // Lagre til fil
    fs.writeFileSync(HOLIDAY_FILE, JSON.stringify({ year: currentYear, dates: holidayDates }, null, 2));
    console.log("Helligdager oppdatert og lagret.");

    return holidayDates;
  } catch (error) {
    console.error("Feil ved henting av helligdager:", error);
    return [];
  }
}

// Funksjon for å sjekke om det er en rød dag eller 24. desember
async function isNonWorkingDay() {
  try {
    const osloTime = await getCurrentOsloTime();
    if (!osloTime) return true; // Hvis vi ikke kan hente tid, sender vi ikke varsel

    const today = osloTime.date; // YYYY-MM-DD
    const dayOfWeek = osloTime.dayOfWeek; // "Monday", "Tuesday", etc.

    // Ikke varsle på helg
    if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
      console.log("Det er helg, ingen varsling sendes.");
      return true;
    }

    // Ikke varsle på 24. desember
    if (today.endsWith("-12-24")) {
      console.log("Det er 24. desember, ingen varsling sendes.");
      return true;
    }

    // Sjekk om det er en helligdag
    const holidays = await fetchAndStoreHolidays();
    if (holidays.includes(today)) {
      console.log("Det er en helligdag, ingen varsling sendes.");
      return true;
    }

    return false;
  } catch (error) {
    console.error("Feil ved sjekk av arbeidsdag:", error);
    return true; // Standard til å ikke sende varsling hvis vi ikke kan sjekke
  }
}

// Funksjon for å sende lunsjmelding hvis det ikke er helg, helligdag eller 24. desember
async function sendLunchMessage() {
  if (await isNonWorkingDay()) return;

  const osloTime = await getCurrentOsloTime();
  if (!osloTime) return;

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
cron.schedule("45 10 * * 1-5", async () => { // 10:30 UTC = 11:30 Oslo tid
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
