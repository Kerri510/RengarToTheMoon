const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
				.setRequired(true)),
	async execute(interaction) {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}

		console.log(path.dirname(__dirname));
		const foldersPath = path.dirname(__dirname);
		const commandFolders = fs.readdirSync(foldersPath);
		let finalCommandPath = undefined;

		for (const folder of commandFolders) {
			if (finalCommandPath){
				console.log("Break outer loop: "+finalCommandPath);
				break;
			}
			const commandsPath = path.join(foldersPath, folder);
			const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				if (path.parse(file).name === command.data.name){
					finalCommandPath = path.join(commandsPath, file);
					console.log("Break inner loop: "+finalCommandPath);
					break;
				}
			}
		}

		delete require.cache[require.resolve(finalCommandPath)];

		try {
			interaction.client.commands.delete(command.data.name);
			const newCommand = require(finalCommandPath);
			interaction.client.commands.set(newCommand.data.name, newCommand);
			await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
		} catch (error) {
			console.error(error);
			await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
		}
	},
};
