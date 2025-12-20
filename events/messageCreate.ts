import { Events,  MessageFlags, Message} from "discord.js";
import config from "../config";
import chalk from "chalk";

export default {
    name: Events.MessageCreate,
    on: true,
    async execute(message: Message) {
        if(message.author.bot) return;
        if (!message.content.startsWith(config.prefix)) return;
        if(message.content.startsWith(config.prefix)) console.log("Command Recieved")
        // const command = await message.client.message_commands.get(message.content)
        const args = message.content.slice(config.prefix.length).trim().split(/ +/)
        const commandName = args.shift()?.toLowerCase()
        if(!commandName)  return;

        const command = await message.client.message_commands.get(commandName)
        if(!command) return;
        try { 
            
        if(config.maintainenace) { 
            if(config.testers.includes(message.author.id)) {
                await command.execute(message, args)
            } else {
                return message.reply({content: "Bot is currently under maintainenace"})
            }
        } else {
            await command.execute(message, args)
        }
           
        } catch(err) {
            console.log(chalk.red(`[ERROR] ${err}`))
            await message.reply("Something went wrong!")
        }
    }
}