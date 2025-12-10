import { Events,  MessageFlags, Message} from "discord.js";
import { prefix } from "../config";
import chalk from "chalk";

export default {
    name: Events.MessageCreate,
    on: true,
    async execute(message: Message) {
        if(message.author.bot) return;
        const parts = message.content.trim().split(/ +/);        
        if (parts.length === 0) return;
        const commandName = parts[0].toLowerCase()
        const args = parts.slice(1)
        const command = message.client.no_pref_commands.get(commandName);
        if(!command) return ;
        try {
            await command.execute(message, args)
        } catch (err) {
            console.log(chalk.red(`[NO PREFIX CMD ERROR] ${err}`));
            await message.reply("Something went wrong running that command.");
        }
    } 
}