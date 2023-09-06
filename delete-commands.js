require('dotenv').config();
const { REST, Routes } = require('discord.js');
const clientId = process.env.APPLICATION_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.DISCORD_TOKEN;

const rest = new REST().setToken(token);

// ...

// for guild-based commands
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);