import chalk from "chalk";
import { Client, Events } from "discord.js";


export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(chalk.green(`[READY] Bot has logged in as ${client.user?.username}`))
    }
}