require('dotenv').config();
const path = require('node:path');
const axios = require('axios');
const List = require('collections/list');

const queues = require(path.join(__dirname, '../commands/lol/bspjsons/queues'));
const rankEmoji = require(path.join(__dirname, '../commands/lol/bspjsons/rankEmoji'));
const champs = require(path.join(__dirname, '../commands/lol/bspjsons/champs'));
const champMasteryLvl = require(path.join(__dirname, '../commands/lol/bspjsons/champMasteryLvl'));

const { players } = require(path.join(__dirname, '../config.json'));
const { EmbedBuilder } = require('discord.js');

const config = {
	headers: {
		'X-Riot-Token': process.env.API_KEY,
	},
};

const winRate = new List();
const gamesPlayed = new List();


class Activegamebot {
	constructor(client) {
		this.isPlayerIngame(client);
	}

	async isPlayerIngame(client) {
		for (const player of players) {
			for (const account of player.accounts) {
				axios.get('https://euw1.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/' + account.summonerId, config) // 20000 requests every 10 seconds //1200000 requests every 10 minutes
					.then(async function(response) {
						console.log(account.ingamename + ' ist ingame!');
						const channel = client.channels.cache.get('1129519381056069652');
						channel.send({ embeds: [await buildEmbed(response.data, account.ingamename, account.summonerId)] });
					})
					.catch(function(error) {
						// console.log(error);
					});
			}
		}
	}
}

function getDescriptionByQueues(queueId) {
	const queue = queues.find(queue => queue.queueId === queueId);
	return queue.map + ' | ' + queue.description;
}

async function getRankBySummonerId(summonerId) {
	let returnValue = '<:unranked:1147996680147435551> Unranked';
	await axios.get('https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/' + summonerId, config) // 100 requests every 1 minutes
		.then(function(response) {
			const temp = winRate.length;
			const temp1 = gamesPlayed.length;
			for (const rankTypes of response.data) {
				if (rankTypes.queueType === 'RANKED_SOLO_5x5') {
					winRate.add(Math.floor((rankTypes.wins / (rankTypes.wins + rankTypes.losses)) * 100) + '%');
					gamesPlayed.add(rankTypes.wins + rankTypes.losses);

					const foundRank = rankEmoji.find(rank => rank.id === rankTypes.tier);

					returnValue = foundRank.emoji + ' ' + (rankTypes.tier === ('MASTER' || 'GRANDMASTER' || 'CHALLENGER') ? rankTypes.tier : rankTypes.tier + ' ' + rankTypes.rank) + ' ' + rankTypes.leaguePoints + ' LP';
					// console.log(returnValue);
				}
			}
			if (temp === winRate.length) {
				winRate.add('NaN');
			}
			if (temp1 === gamesPlayed.length) {
				gamesPlayed.add(0);
			}
		})
		.catch(function(error) {
			// console.log(error);
			returnValue = 'Error';
		});
	return returnValue;
}

async function getMasteryOfChampBySummonerId(summonerId, champId) {
	let returnValue = '-';
	await axios.get('https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/' + summonerId + '/by-champion/' + champId, config) // 2000 requests every 1 minutes
		.then(function(response) {
			returnValue = champMasteryLvl.find(mastery => mastery.id === response.data.championLevel.toString()).emoji + nFormatter(response.data.championPoints);
			// console.log(returnValue);
		})
		.catch(function(error) {
			// console.log(error);
			returnValue = '-';
		});
	return returnValue;
}

function nFormatter(num) {
	const lookup = [
		{ value: 1, symbol: '' },
		{ value: 1e3, symbol: 'K' },
		{ value: 1e6, symbol: 'M' },
		{ value: 1e9, symbol: 'B' },
		{ value: 1e12, symbol: 'T' },
	];
	const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
	const item = lookup.slice().reverse().find(function(item) {
		return num >= item.value;
	});
	if (item) {
		if (item.symbol === 'M' || item.symbol === 'B' || item.symbol === 'T') {
			return (num / item.value).toFixed(1).replace(rx, '$1') + item.symbol;
		}
		else {
			return (num / item.value).toFixed(0) + item.symbol;
		}
	}
	else {
		return '0';
	}
}

function secondsToMMSS(seconds) {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	// Use string interpolation to format the result with leading zeros if needed
	const mm = minutes < 10 ? `0${minutes}` : minutes.toString();
	const ss = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds.toString();

	return `${mm}:${ss}`;
}

function epochMillisecondsToDateTime(epochMilliseconds) {
	const date = new Date(epochMilliseconds);

	// Extract date components
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
	const day = date.getDate().toString().padStart(2, '0');

	// Extract time components
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');

	return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

async function buildEmbed(gameData, summonername, summonerID) {
	return new EmbedBuilder()
		.setColor(0x0099FF)
		.setTitle(getDescriptionByQueues(gameData.gameQueueConfigId) + ' | ' + summonername)
		.setURL('https://www.op.gg/summoners/euw/' + summonername.replace(/ /g, '%20') + '/ingame')
		.addFields({
			name: gameData.participants[0].teamId === 100 ? 'Blue Team' : 'Red Team',
			value: champs.find(emoji => emoji.key === gameData.participants[0].championId.toString()).id + ' ' + (gameData.participants[0].summonerId === summonerID ? '**__' + gameData.participants[0].summonerName + '__**' : gameData.participants[0].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[1].championId.toString()).id + ' ' + (gameData.participants[1].summonerId === summonerID ? '**__' + gameData.participants[1].summonerName + '__**' : gameData.participants[1].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[2].championId.toString()).id + ' ' + (gameData.participants[2].summonerId === summonerID ? '**__' + gameData.participants[2].summonerName + '__**' : gameData.participants[2].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[3].championId.toString()).id + ' ' + (gameData.participants[3].summonerId === summonerID ? '**__' + gameData.participants[3].summonerName + '__**' : gameData.participants[3].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[4].championId.toString()).id + ' ' + (gameData.participants[4].summonerId === summonerID ? '**__' + gameData.participants[4].summonerName + '__**' : gameData.participants[4].summonerName),
			inline: true,
		},
		{
			name: 'Solo/Duo Rank | WR | Games Played',
			value: await getRankBySummonerId(gameData.participants[0].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[1].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[2].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[3].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[4].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift(),
			inline: true,
		},
		{
			name: 'Mastery',
			value: await getMasteryOfChampBySummonerId(gameData.participants[0].summonerId, gameData.participants[0].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[1].summonerId, gameData.participants[1].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[2].summonerId, gameData.participants[2].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[3].summonerId, gameData.participants[3].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[4].summonerId, gameData.participants[4].championId),
			inline: true,
		},
		// { name: '\u200B', value: '\u200B' },
		{
			name: gameData.participants[5].teamId === 100 ? 'Blue Team' : 'Red Team',
			value: champs.find(emoji => emoji.key === gameData.participants[5].championId.toString()).id + ' ' + (gameData.participants[5].summonerId === summonerID ? '**__' + gameData.participants[5].summonerName + '__**' : gameData.participants[5].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[6].championId.toString()).id + ' ' + (gameData.participants[6].summonerId === summonerID ? '**__' + gameData.participants[6].summonerName + '__**' : gameData.participants[6].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[7].championId.toString()).id + ' ' + (gameData.participants[7].summonerId === summonerID ? '**__' + gameData.participants[7].summonerName + '__**' : gameData.participants[7].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[8].championId.toString()).id + ' ' + (gameData.participants[8].summonerId === summonerID ? '**__' + gameData.participants[8].summonerName + '__**' : gameData.participants[8].summonerName) + '\n' +
					champs.find(emoji => emoji.key === gameData.participants[9].championId.toString()).id + ' ' + (gameData.participants[9].summonerId === summonerID ? '**__' + gameData.participants[9].summonerName + '__**' : gameData.participants[9].summonerName),
			inline: true,
		},
		{
			name: 'Solo/Duo Rank | WR | Games Played',
			value: await getRankBySummonerId(gameData.participants[5].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[6].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[7].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[8].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift() + '\n' +
					await getRankBySummonerId(gameData.participants[9].summonerId) + ' | ' + winRate.shift() + ' | ' + gamesPlayed.shift(),
			inline: true,
		},
		{
			name: 'Mastery',
			value: await getMasteryOfChampBySummonerId(gameData.participants[5].summonerId, gameData.participants[5].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[6].summonerId, gameData.participants[6].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[7].summonerId, gameData.participants[7].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[8].summonerId, gameData.participants[8].championId) + '\n' +
					await getMasteryOfChampBySummonerId(gameData.participants[9].summonerId, gameData.participants[9].championId),
			inline: true,
		},
		)
		.setFooter({ text: 'Spiel gestartet am ' + epochMillisecondsToDateTime(gameData.gameStartTime) + ' Aktuelle Dauer des Spiels: ' + secondsToMMSS(gameData.gameLength) });
}

module.exports = Activegamebot;