const cron = require('node-cron'); // Importerer node-cron for å kjøre tidsplanlagte oppgaver
const client = require('./client'); // Importerer Discord-klienten
const { getCurrentOsloTime, fetchAndStoreHolidays } = require('./api'); // Importerer API-funksjoner for tid og helligdager
const { channelId, roleId } = require('./config'); // Importerer kanal- og rolle-ID fra konfigurasjon

/**
 * Sjekker om dagen er en ikke-arbeidsdag (helg eller helligdag).
 * @returns {Promise<boolean>} - Returnerer `true` hvis det er en ikke-arbeidsdag, ellers `false`.
 */
async function isNonWorkingDay() {
  try {
    const osloTime = await getCurrentOsloTime(); // Henter nåværende dato og tid for Oslo
    if (!osloTime) return true; // Hvis ingen tid ble hentet, antar vi at det er en ikke-arbeidsdag

    const today = osloTime.date; // Dagens dato i formatet "YYYY-MM-DD"
    const dayOfWeek = osloTime.dayOfWeek; // Ukedagens navn

    // Sjekker om det er helg (lørdag eller søndag)
    if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
      console.log("Det er helg, ingen varsling sendes.");
      return true;
    }

    // Sjekker om det er julaften (24. desember)
    if (today.endsWith("-12-24")) {
      console.log("Det er 24. desember, ingen varsling sendes.");
      return true;
    }

    // Sjekker om dagens dato er en helligdag
    const holidays = await fetchAndStoreHolidays();
    if (holidays.includes(today)) {
      console.log("Det er en helligdag, ingen varsling sendes.");
      return true;
    }

    return false; // Hvis ingen av de overnevnte betingelsene er oppfylt, er det en arbeidsdag
  } catch (error) {
    console.error("Feil ved sjekk av arbeidsdag:", error);
    return true; // Hvis det oppstår en feil, antar vi at det er en ikke-arbeidsdag for å unngå feilvarsler
  }
}

/**
 * Sender en lunsjmelding i en Discord-kanal hvis det er en arbeidsdag.
 */
async function sendLunchMessage() {
  if (await isNonWorkingDay()) return; // Hvis det er en ikke-arbeidsdag, sendes ingen melding

  const osloTime = await getCurrentOsloTime(); // Henter Oslo-tid igjen for å logge tidspunktet meldingen sendes
  if (!osloTime) return; // Hvis ingen tid ble hentet, avbrytes operasjonen

  const channel = client.channels.cache.get(channelId); // Henter Discord-kanalen ved hjelp av kanal-ID
  if (channel) {
    channel.send(`<@&${roleId}> Det er på tide for lunsj! 🍽️`) // Sender melding med ping til en spesifikk rolle
      .then(() => console.log(`Lunsjvarsling sendt kl. ${osloTime.time}`)) // Logger tidspunktet meldingen ble sendt
      .catch(err => console.error("Kunne ikke sende melding:", err)); // Logger eventuelle feil ved sending
  } else {
    console.log("Fant ikke kanalen."); // Logger hvis kanalen ikke ble funnet
  }
}

/**
 * Planlegger en daglig oppgave som sjekker og sender en lunsjmelding kl. 11:30 mandag til fredag.
 */
function scheduleLunchNotification() {
  cron.schedule("30 11 * * 1-5", async () => { // Kjører hver ukedag (mandag-fredag) kl. 11:30
    console.log("Sjekker om lunsjmelding skal sendes...");
    await sendLunchMessage(); // Kaller funksjonen for å sende melding hvis det er en arbeidsdag
  });
}

// Eksporterer funksjonen slik at den kan brukes i andre moduler
module.exports = { scheduleLunchNotification };

