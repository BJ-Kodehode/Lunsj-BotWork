// Laster inn miljøvariabler fra en .env-fil
require('dotenv').config(); 

// Importerer Discord-klienten fra client.js
const client = require('./client'); 

// Importerer funksjonen for å planlegge lunsjvarsler
const { scheduleLunchNotification } = require('./lunchNotifier'); 

// Når boten er klar (eventet "ready" fyres én gang etter oppstart)
client.once("ready", () => {
  console.log("Boten er klar og kjører!"); // Logger at boten er klar
  scheduleLunchNotification(); // Starter tidsplanlagt oppgave for lunsjvarsler
});

// Logger inn boten ved hjelp av Discord-token fra .env-filen
client.login(process.env.TOKEN)
  .then(() => console.log("Boten er logget inn!")) // Logger suksessmelding hvis innloggingen lykkes
  .catch(err => console.error("Kunne ikke logge inn:", err)); // Logger feil hvis innloggingen mislykkes
