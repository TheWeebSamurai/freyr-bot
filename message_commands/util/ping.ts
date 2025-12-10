import { Message } from "discord.js"
export default {
    name: "ping",
    async execute(message: Message, args) {
        const latency = Date.now() - message.createdTimestamp;
        await message.reply(`PONG! Message Latency: ${latency} ms`)
    }
}