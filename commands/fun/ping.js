const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply({content: '<:dickerbizeps2:852636366369849404>'+" "+"<:bronze:1147922931008147456>"+" schwanznase"}); // ephemeral: true (um nur einen user die nachricht sehen zu lassen)
		//await wait(5000);
		//await interaction.deleteReply();
	},
};