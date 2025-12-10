import { Message, EmbedBuilder, ChannelType, Channel, MessageCall } from "discord.js"

export default {
name: "ticket",
async execute(message: Message, args: any[]) {


    if(message.channel.type !== ChannelType.GuildText) return message.reply("This command can only be ran on guild channels")
    let prntId = message.channel.parent?.id
    const channel = message.guild?.channels.create({name: `Ticket-${message.author.id}`, topic: message.author.id, parent: prntId})
}
}