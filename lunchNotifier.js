const cron = require('node-cron'); 
const client = require('./client'); 
const { getCurrentOsloTime, fetchAndStoreHolidays } = require('./api'); 
const { channelId, roleId } = require('./config'); 

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

async function sendLunchMessage(message) {
  if (await isNonWorkingDay()) return;
  const osloTime = await getCurrentOsloTime();
  if (!osloTime) return; 

  const channel = client.channels.cache.get(channelId);
  if (channel) {
    channel.send(`<@&${roleId}> ${message}`)
      .then(() => console.log(`Lunsjvarsling sendt kl. ${osloTime.time}`))
      .catch(err => console.error("Kunne ikke sende melding:", err));
  } else {
    console.log("Fant ikke kanalen.");
  }
}

function scheduleLunchNotification() {
  cron.schedule("0 11 * * 1-5", () => sendLunchMessage("Lunsj om 30 minutter! 🍽️"));
  cron.schedule("10 11 * * 1-5", () => sendLunchMessage("Lunsj om 20 minutter! 🍽️"));
  cron.schedule("20 11 * * 1-5", () => sendLunchMessage("Lunsj om 10 minutter! 🍽️"));
  cron.schedule("30 11 * * 1-5", () => sendLunchMessage("Det er på tide for lunsj! 🍽️"));
}

module.exports = { scheduleLunchNotification };
