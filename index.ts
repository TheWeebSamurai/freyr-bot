import chalk from 'chalk'
import {Client, Events, GatewayIntentBits, Collection, MessageFlags} from 'discord.js'
import config from "./config.js";
const { token } = config;
import fs from 'fs'
import path from 'path'
import { redis } from './redis.ts'

import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(config.mongoose_url);

        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectDB();
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages]})
// client.once('clientReady', (ready) => {
//     console.log(chalk.green(`Logged in as ${ready.user.username}`))


client.redis = redis

client.commands = new Collection()

const folderPath = path.join(__dirname, 'slash_commands')
const commandFolder = fs.readdirSync(folderPath)
for(const folder of commandFolder) {
    const commandPath  = path.join(folderPath, folder)
    const commandFile = fs.readdirSync(commandPath).filter((file) => file.endsWith('.ts'))
    for(const file of commandFile) {
        const filePath = path.join(commandPath, file)
        const command = require(filePath)
        const cmd = command.default ?? command;
        if('data' in cmd && 'execute' in cmd) {
            client.commands.set(cmd.data.name, cmd)
            // console.log(chalk.green(`[SLASH-COMMAND]Slash command ${cmd.data.name} Loaded`));
        console.log(`${chalk.blue("[SLASH-COMMANDS]")} ${chalk.green(`${cmd.data.name} Loaded!`)}`)

        } else {
            console.log(chalk.red("[WARNING]") + chalk.yellow(`The slash command ${command} doesnt have a data or an execute property`))
        }
    }
}

const eventsPath = path.join(__dirname, 'events')
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith('.ts'))

for(const file of eventFiles) {
    const filePath = path.join(eventsPath, file)
    const evnt = require(filePath)
    const event = evnt.default ?? evnt

    if(event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    }
    if(event.on) {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.message_commands = new Collection()

const msgCommandPath = path.join(__dirname, "message_commands")
const msg_command_folder = fs.readdirSync(msgCommandPath)
for(const folder of msg_command_folder) {
    const commandPath = path.join(msgCommandPath, folder)
    const commandFile = fs.readdirSync(commandPath).filter((file) => file.endsWith('ts'))
    for(const file of commandFile) {
        const filePath = path.join(commandPath, file)
        const command = require(filePath)
        const cmd = command.default ?? command;
        if('name' in cmd && 'execute' in cmd) {
            client.message_commands.set(cmd.name, cmd)
            // console.log(chalk.green(`[PREFIX-COMMAND] Loaded ${cmd.name}`));
            console.log(`${chalk.blue("PREFIXED-COMMANd]")} ${chalk.green(`${cmd.name} Loaded!`)}`)

        } else {
            console.log(chalk.red(`[WARNING] prefixed command ${file} missing name or execute.`));
        }
    }   
}

client.no_pref_commands = new Collection()
const npr_comm_path = path.join(__dirname, "no_pref_commands")
const noPrefFiles = fs.readdirSync(npr_comm_path).filter((file) => file.endsWith('.ts'))
for(const file of noPrefFiles) {
    const commandPath = path.join(npr_comm_path, file)
    const command = require(commandPath)
    const cmd = command.default ?? command;
    if('name' in cmd && 'execute' in cmd) {
        client.no_pref_commands.set(cmd.name, cmd)
        // console.log(chalk.green(`[NO-PREFIX] Loaded ${cmd.name}`));
        console.log(`${chalk.blue("[NO-PREFIX]")} ${chalk.green(`${cmd.name} Loaded!`)}`)
    } else {
        console.log(chalk.red(`[WARNING] No-prefix command ${file} missing name or execute.`));
    }
}

export default client;

client.login(config.token) 