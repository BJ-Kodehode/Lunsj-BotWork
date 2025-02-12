require('dotenv').config(); // Laster inn miljøvariabler fra .env
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

// Sjekk om fetch er tilgjengelig i den nåværende versjonen av Node.js
let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  fetch = require('node-fetch');
}

// Hent miljøvariabler fra .env-filen
const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;

// API-er for tids- og helligdagsinformasjon
const TIME_API_URL = "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Oslo";
const ALT_TIME_API = "http://worldtimeapi.org/api/timezone/Europe/Oslo";
const HOLIDAY_API_URL = "https://date.nager.at/Api/v2/PublicHolidays";
const HOLIDAY_FILE = "holidays.json";

// Sjekk om nødvendige miljøvariabler er satt
if (!token || !channelId || !roleId) {
  console.error('Feil: Token, Channel ID eller Role ID mangler! Sjekk at .env-filen er riktig konfigurert.');
  process.exit(1);
}

// Opprett en ny Discord-klient
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Hjelpefunksjon for å prøve å hente data fra et API flere ganger
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP feil: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Feil ved henting av data (forsøk ${attempt + 1}):`, error);
      if (attempt < retries - 1) await new Promise(res => setTimeout(res, delay));
    }
  }
  return null;
}

// Hent nåværende dato og tid fra Time API, med WorldTimeAPI som backup
async function getCurrentOsloTime() {
  let data = await fetchWithRetry(TIME_API_URL);
  
  if (!data) {
    console.warn("Time API feilet, bytter til WorldTimeAPI...");
    data = await fetchWithRetry(ALT_TIME_API);
    if (!data) {
      console.error("Kunne ikke hente tid fra noen API-er.");
      return null;
    }
    return { date: data.datetime.split("T")[0], time: data.datetime.split("T")[1].substring(0, 8) };
  }
  
  return data;
}

// Hent og lagre helligdager i en lokal fil
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

// Sjekk om det er en helgedag eller rød dag
async function isNonWorkingDay() {
  try {
    const osloTime = await getCurrentOsloTime();
    if (!osloTime) return true;

    const today = osloTime.date;
    const dayOfWeek = osloTime.dayOfWeek;

    // Ikke varsle på helg
    if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
      console.log("Det er helg, ingen varsling sendes.");
      return true;
    }

    // Ikke varsle på julaften
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
    return true;
  }
}

// Send lunsjmelding dersom det er en arbeidsdag
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

// Planlegg lunsjvarsling kl. 11:30 Oslo-tid (10:30 UTC) på hverdager
cron.schedule("30 11 * * 1-5", async () => {
  console.log("Sjekker om lunsjmelding skal sendes...");
  await sendLunchMessage();
});

// Logg inn Discord-boten
client.login(token)
  .then(() => console.log("Boten er logget inn!"))
  .catch(err => console.error("Kunne ikke logge inn:", err));

client.once("ready", () => {
  console.log("Boten er klar og kjører!");
});
