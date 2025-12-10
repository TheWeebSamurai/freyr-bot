import { Message } from "discord.js"

export default {
    name: "aswhat",
    async execute(message: Message, args: any[]) {
        message.reply("aswhat")
    }
}

//basic no prefix command template