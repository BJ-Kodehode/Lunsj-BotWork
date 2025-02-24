const fs = require('fs'); // Importerer filsystemmodulen for lesing og skriving av filer
const fetch = require('node-fetch'); // Importerer node-fetch for å gjøre HTTP-forespørsler
const { TIME_API_URL, ALT_TIME_API, HOLIDAY_API_URL, HOLIDAY_FILE } = require('./config'); // Importerer konfigurasjonsverdier fra en ekstern fil

/**
 * Henter data fra en URL med flere forsøk ved feil.
 * @param {string} url - URL-en som skal hentes.
 * @param {number} retries - Antall ganger det skal prøves på nytt ved feil (default: 3).
 * @param {number} delay - Forsinkelse i millisekunder mellom forsøk (default: 1000 ms).
 * @returns {Promise<Object|null>} - Returnerer JSON-data eller null hvis alle forsøk mislykkes.
 */
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP feil: ${response.status}`); // Kaster feil hvis responsen ikke er OK
      return await response.json(); // Returnerer JSON-data ved suksess
    } catch (error) {
      console.error(`Feil ved henting av data (forsøk ${attempt + 1}):`, error);
      if (attempt < retries - 1) await new Promise(res => setTimeout(res, delay)); // Venter før nytt forsøk
    }
  }
  return null; // Returnerer null hvis alle forsøk mislykkes
}

/**
 * Henter nåværende tid i Oslo fra en API-tjeneste.
 * Hvis hoved-API-et feiler, prøver den et alternativt API.
 * @returns {Promise<{date: string, time: string} | null>} - Returnerer dato og tid eller null ved feil.
 */
async function getCurrentOsloTime() {
  let data = await fetchWithRetry(TIME_API_URL); // Prøver hoved-API-et først
  if (!data) {
    console.warn("Time API feilet, bytter til WorldTimeAPI...");
    data = await fetchWithRetry(ALT_TIME_API); // Prøver alternativt API
    if (!data) {
      console.error("Kunne ikke hente tid fra noen API-er.");
      return null;
    }
    // Formaterer dato og tid fra alternativt API
    return { date: data.datetime.split("T")[0], time: data.datetime.split("T")[1].substring(0, 8) };
  }
  return data; // Returnerer data fra hoved-API-et hvis det fungerte
}

/**
 * Henter og lagrer helligdager for det nåværende året.
 * Hvis filen allerede eksisterer og inneholder data for gjeldende år, brukes disse i stedet for ny henting.
 * @returns {Promise<string[]>} - Returnerer en liste med datoer for helligdager.
 */
async function fetchAndStoreHolidays() {
  try {
    const currentYear = new Date().getFullYear(); // Henter nåværende år

    // Sjekker om filen med helligdager allerede eksisterer og er oppdatert for dette året
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
    const holidayDates = holidays.map(holiday => holiday.date); // Ekstraherer datoene

    // Lagrer helligdager til en lokal fil
    fs.writeFileSync(HOLIDAY_FILE, JSON.stringify({ year: currentYear, dates: holidayDates }, null, 2));
    console.log("Helligdager oppdatert og lagret.");
    return holidayDates;
  } catch (error) {
    console.error("Feil ved henting av helligdager:", error);
    return [];
  }
}

// Eksporterer funksjonene for bruk i andre moduler
module.exports = { getCurrentOsloTime, fetchAndStoreHolidays };
