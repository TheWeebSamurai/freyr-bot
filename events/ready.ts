import chalk from "chalk";
import { Client, Events } from "discord.js";
import { hook } from "..";

export default {
    name: Events.ClientReady,
    once: true,
    execute(client: Client) {
        console.log(chalk.green(`[READY] Bot has logged in as ${client.user?.username}`))
        hook.send({content: "FreyrBOT has started, Please delete this message!"})
    }
}