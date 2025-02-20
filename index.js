require('dotenv').config();
const client = require('./client');
const { scheduleLunchNotification } = require('./lunchNotifier');

client.once("ready", () => {
  console.log("Boten er klar og kjører!");
  scheduleLunchNotification();
});

client.login(process.env.TOKEN)
  .then(() => console.log("Boten er logget inn!"))
  .catch(err => console.error("Kunne ikke logge inn:", err));
