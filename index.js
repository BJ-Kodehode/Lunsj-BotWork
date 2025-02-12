require('dotenv').config(); // Laster inn miljøvariabler fra .env
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');

let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  fetch = require('node-fetch');
}

const token = process.env.TOKEN;
const channelId = process.env.CHANNEL_ID;
const roleId = process.env.ROLE_ID;

const TIME_API_URL = "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Oslo";
const ALT_TIME_API = "http://worldtimeapi.org/api/timezone/Europe/Oslo";
const HOLIDAY_API_URL = "https://date.nager.at/Api/v2/PublicHolidays";
const HOLIDAY_FILE = "holidays.json";

if (!token || !channelId || !roleId) {
  console.error('Feil: Token, Channel ID eller Role ID mangler! Sjekk at .env-filen er riktig konfigurert.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

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

async function fetchAndStoreHolidays() {
  try {
    const currentYear = new Date().getFullYear();
    
    if (fs.existsSync(HOLIDAY_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(HOLIDAY_FILE, "utf8"));
      if (fileData.year === currentYear) {
        console.log("Helligdager er allerede oppdatert for dette året.");
        return fileData.dates;
      }
    }

    const response = await fetch(`${HOLIDAY_API_URL}/${currentYear}/NO`);
    const holidays = await response.json();
    
    const holidayDates = holidays.map(holiday => holiday.date);
    fs.writeFileSync(HOLIDAY_FILE, JSON.stringify({ year: currentYear, dates: holidayDates }, null, 2));
    console.log("Helligdager oppdatert og lagret.");

    return holidayDates;
  } catch (error) {
    console.error("Feil ved henting av helligdager:", error);
    return [];
  }
}

async function isNonWorkingDay() {
  try {
    const osloTime = await getCurrentOsloTime();
    if (!osloTime) return true;

    const today = osloTime.date;
    const dayOfWeek = osloTime.dayOfWeek;

    if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
      console.log("Det er helg, ingen varsling sendes.");
      return true;
    }

    if (today.endsWith("-12-24")) {
      console.log("Det er 24. desember, ingen varsling sendes.");
      return true;
    }

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

cron.schedule("30 11 * * 1-5", async () => {
  console.log("Sjekker om lunsjmelding skal sendes...");
  await sendLunchMessage();
});

client.login(token)
  .then(() => console.log("Boten er logget inn!"))
  .catch(err => console.error("Kunne ikke logge inn:", err));

client.once("ready", () => {
  console.log("Boten er klar og kjører!");
});
