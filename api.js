const fs = require('fs');
const fetch = require('node-fetch');
const config = require('./config'); // Krever CommonJS-modul


const fs = require('fs');
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

module.exports = { getCurrentOsloTime };
