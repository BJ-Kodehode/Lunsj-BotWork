const cron = require('node-cron');
const client = require('./client');
const { getCurrentOsloTime, fetchAndStoreHolidays } = require('./api');
const { channelId, roleId, lunchTime } = require('./config');
const log = require('./logger');

async function isNonWorkingDay() {
  try {
    const osloTime = await getCurrentOsloTime();
    if (!osloTime) return true;

    const today = osloTime.date;
    const dayOfWeek = osloTime.dayOfWeek;

    if (["Saturday", "Sunday"].includes(dayOfWeek) || today.endsWith("-12-24")) {
      log(`Ingen varsling - ${dayOfWeek === "Saturday" ? "lørdag" : dayOfWeek === "Sunday" ? "søndag" : "24. desember"}.`);
      return true;
    }

    const holidays = await fetchAndStoreHolidays();
    if (holidays.includes(today)) {
      log("Ingen varsling - helligdag.");
      return true;
    }

    return false;
  } catch (error) {
    log(`Feil ved sjekk av arbeidsdag: ${error.message}`);
    return true;
  }
}

async function sendLunchMessage() {
  if (await isNonWorkingDay()) return;

  const channel = client.channels.cache.get(channelId);
  if (channel) {
    await channel.send(`<@&${roleId}> Det er på tide for lunsj! 🍽️`);
    log("Lunsjmelding sendt!");
  } else {
    log("Fant ikke kanalen.");
  }
}

function scheduleLunchNotification() {
  const [hour, minute] = lunchTime.split(":");
  cron.schedule(`${minute} ${hour} * * 1-5`, sendLunchMessage);
  log("Lunsjvarsling planlagt.");
}

module.exports = { scheduleLunchNotification, sendLunchMessage };