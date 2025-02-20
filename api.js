const fs = require('fs');
const fetch = require('node-fetch');
const log = require('./logger');
const { TIME_API_URL, ALT_TIME_API, HOLIDAY_API_URL, HOLIDAY_FILE } = require('./config');

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP feil: ${response.status}`);
      return await response.json();
    } catch (error) {
      log(`Feil ved henting av data fra ${url} (forsøk ${attempt + 1}): ${error.message}`);
      if (attempt < retries - 1) await new Promise(res => setTimeout(res, delay));
    }
  }
  return null;
}

async function getCurrentOsloTime() {
  let data = await fetchWithRetry(TIME_API_URL);
  if (!data) {
    log("Time API feilet, bytter til WorldTimeAPI...");
    data = await fetchWithRetry(ALT_TIME_API);
  }
  return data ? { date: data.datetime.split("T")[0], time: data.datetime.split("T")[1].substring(0, 8) } : null;
}

async function fetchAndStoreHolidays() {
  try {
    const currentYear = new Date().getFullYear();
    if (fs.existsSync(HOLIDAY_FILE)) {
      const fileData = JSON.parse(fs.readFileSync(HOLIDAY_FILE, "utf8"));
      if (fileData.year === currentYear) {
        log("Helligdager er allerede oppdatert for dette året.");
        return fileData.dates;
      }
    }

    const response = await fetch(`${HOLIDAY_API_URL}/${currentYear}/NO`);
    if (!response.ok) throw new Error(`HTTP feil: ${response.status}`);

    const holidays = await response.json();
    const holidayDates = holidays.map(holiday => holiday.date);

    fs.writeFileSync(HOLIDAY_FILE, JSON.stringify({ year: currentYear, dates: holidayDates }, null, 2));
    log("Helligdager oppdatert og lagret.");
    return holidayDates;
  } catch (error) {
    log(`Feil ved henting av helligdager: ${error.message}`);
    return [];
  }
}

module.exports = { getCurrentOsloTime, fetchAndStoreHolidays };
