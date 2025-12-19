import { Message, PermissionFlagsBits, TextChannel, User } from "discord.js"

export default {
    name: "taddmember",
    async execute(message: Message, args: any[]) {
        let channel = message.channel as TextChannel
        let mentioneduser = message.mentions.members?.first()
        let user = message.member
        if(!user?.permissions.has(PermissionFlagsBits.ManageMessages)) return;
        if(!channel.name.startsWith('ticket')) return;
        if(!mentioneduser) return message.reply({content: "Please mention a user!"})
        
        try {
            channel.permissionOverwrites.edit(mentioneduser.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AddReactions: true,
            })
            message.reply({content: `Added <@${mentioneduser.id} to the ticket`})
        } catch (e) {
            console.log(e)
            message.reply("Something went wrong while executing the command, please check my permissions and check console logs for more information!")
        }
    }
}

