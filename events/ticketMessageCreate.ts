import { Events,  MessageFlags, Message, MessageActivityType, TextChannel} from "discord.js";
import config from "../config";
import chalk from "chalk";
import ticketmodel from "../models/ticketmodel";

export default {
    name: Events.MessageCreate,
    on: true,
    async execute(message: Message) {
        if(message.author.bot) return;
        const ticketchannel = message.channel as TextChannel
        if(!ticketchannel.name.startsWith("ticket-")) return;

        const check_for_ticket = await ticketmodel.findOne({$and: [{ticket_id: `ticket-${ticketchannel.topic}`}, {status: "OPEN"}]})

        if(check_for_ticket) {
            check_for_ticket.messages.push({
                author_id: message.author.id,
                author_name: message.author.username,
                author_avatar: message.author.displayAvatarURL(),
                content: message.content,
                timestamp: new Date()
            })

            let users = check_for_ticket.users.find(user => user.user_id === message.author.id)
            if(!users) {
                check_for_ticket.users.push({
                    user_id: message.author.id,
                    user_name: message.author.username,
                    user_profile_picture: message.author.displayAvatarURL()
                })
                
            } 

            await check_for_ticket.save()
        } else {
            message.reply("This ticket doesn't exist!")
        }
    }
}