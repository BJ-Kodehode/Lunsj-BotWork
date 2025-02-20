const { SlashCommandBuilder } = require('discord.js');
const { sendLunchMessage } = require('./lunchNotifier');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lunsj')
    .setDescription('Sender en lunsjmelding manuelt'),
  
  async execute(interaction) {
    await interaction.reply("Sender lunsjmelding...");
    await sendLunchMessage();
  },
};
