const { REST, Routes } = require('discord.js');
const { token, clientId } = require('./config');
const command = require('./commands');

const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  try {
    console.log("Registrerer Slash Commands...");
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: [command.data.toJSON()] }
    );
    console.log("Slash Commands registrert!");
  } catch (error) {
    console.error("Feil ved registrering av commands:", error);
  }
}

registerCommands();
