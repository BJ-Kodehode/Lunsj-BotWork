const fs = require('fs'); 
const { fetch } = require('undici'); // Bruker undici sin fetch i stedet for node-fetch
const { TIME_API_URL, ALT_TIME_API, HOLIDAY_API_URL, HOLIDAY_FILE } = require('./config'); 

/**
 * Henter data fra en URL med automatisk retry ved feil.
 * @param {string} url - API-endepunktet som skal kalles.
 * @param {number} retries - Antall ganger det skal forsøkes på nytt ved feil.
 * @param {number} delay - Ventetid i millisekunder mellom forsøk.
 * @returns {Promise<object|null>} - Returnerer JSON-data eller null hvis alle forsøk feiler.
 */
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP feil: ${response.status}`); // Kaster feil hvis responsen ikke er OK (2xx)
      return await response.json(); // Returnerer JSON-data
    } catch (error) {
      console.error(`Feil ved henting av data (forsøk ${attempt + 1}):`, error);
      if (attempt < retries - 1) await new Promise(res => setTimeout(res, delay)); // Venter før nytt forsøk
    }
  }
  return null; // Returnerer null hvis alle forsøk feiler
}

/**
 * Henter nåværende tid i Oslo ved hjelp av en API-kilde.
 * Hvis det første API-et feiler, brukes et alternativt API.
 * @returns {Promise<object|null>} - Returnerer et objekt med dato og tid, eller null ved feil.
 */
async function getCurrentOsloTime() {
  let data = await fetchWithRetry(TIME_API_URL);
  if (!data) {
    console.warn("Time API feilet, bytter til WorldTimeAPI...");
    data = await fetchWithRetry(ALT_TIME_API);
    if (!data) {
      console.error("Kunne ikke hente tid fra noen API-er.");
      return null;
    }
    return { date: data.datetime.split("T")[0], time: data.datetime.split("T")[1].substring(0, 8) }; // Trekker ut dato og klokkeslett fra datetime-strengen
  }
  return data;
}

/**
 * Henter og lagrer helligdager for det gjeldende året.
 * Hvis filen med helligdager allerede eksisterer og er oppdatert for det gjeldende året, brukes denne i stedet for API-kallet.
 * @returns {Promise<Array<string>>} - Returnerer en liste med helligdagsdatoer.
 */
async function fetchAndStoreHolidays() {
  try {
    const currentYear = new Date().getFullYear();

    // Sjekker om det allerede finnes en oppdatert helligdagsfil
    if (fs.existsSync(HOLIDAY_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(HOLIDAY_FILE, "utf8"));
      if (fileData.year === currentYear) {
        console.log("Helligdager er allerede oppdatert for dette året.");
        return fileData.dates;
      }
    }

    // Henter helligdager fra API-et
    const response = await fetch(`${HOLIDAY_API_URL}/${currentYear}/NO`);
    const holidays = await response.json();

    // Trekker ut kun datoene fra helligdagsobjektene
    const holidayDates = holidays.map(holiday => holiday.date);

    // Lagrer helligdager i en fil for senere bruk
    fs.writeFileSync(HOLIDAY_FILE, JSON.stringify({ year: currentYear, dates: holidayDates }, null, 2));
    console.log("Helligdager oppdatert og lagret.");
    
    return holidayDates;
  } catch (error) {
    console.error("Feil ved henting av helligdager:", error);
    return [];
  }
}

// Eksporterer funksjonene slik at de kan brukes i andre filer
module.exports = { getCurrentOsloTime, fetchAndStoreHolidays };
