const { Events, ChannelManager } = require('discord.js');
const path = require('node:path');
const Activegamebot = require(path.join(__dirname, '../lolClasses/activegamebot'));

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		//const test123 = new Activegamebot(client);
	},
};