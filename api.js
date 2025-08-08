const fs = require('fs');
const fetch = require('node-fetch');
const config = require('./config'); // Krever CommonJS-modul



const log = require('./logger');

const { HOLIDAY_API_URL, HOLIDAY_FILE } = require('./config');

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


