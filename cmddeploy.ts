import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import config from './config.js'
import fs from 'fs'
import path from 'path'
import chalk from "chalk";

const commands: RESTPostAPIApplicationCommandsJSONBody[]  = []
const foldersPath = path.join(__dirname, 'slash_commands')
const commandFolders = fs.readdirSync(foldersPath)
for(const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'))
    for(const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        const command = require(filePath)
        const cmd = command.default ?? command;
        if ('data' in cmd && 'execute' in cmd) {
			commands.push(cmd.data.toJSON());
		} else {
			console.log(chalk.red(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`));
		}
    }
}

const rest = new REST().setToken(config.token);
(async () => {
try {
 console.log(chalk.blue(`Started Refreshing ${commands.length} application commands!`))
 commands.map(command => {
    console.log(chalk.green(`[LOADED] ${command.name}`))
 })
 const data = await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {body: commands})
} catch(err) {
    console.log(chalk.red(`[ERROR] ${err}`))
}
})()

