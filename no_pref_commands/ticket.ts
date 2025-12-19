import { Message, EmbedBuilder, ChannelType, Channel, MessageCall, PermissionFlagsBits } from "discord.js"

export default {
name: "ticket",
async execute(message: Message, args: any[]) {

    let commandUser = message.member
    if(!commandUser?.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return;
    }
    if(message.channel.type !== ChannelType.GuildText) return message.reply("This command can only be ran on guild channels")
    let prntId = message.channel.parent?.id
    console.log("Just a test command peeps move on")
}
}