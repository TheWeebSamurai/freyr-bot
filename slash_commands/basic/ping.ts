import { AutoModerationActionExecution, AutoModerationRuleKeywordPresetType, SlashCommandBuilder } from "discord.js";
import { Client } from "discord.js";
export default {
    data: new SlashCommandBuilder().setName("ping").setDescription("Just a basic ping command mah dude"),
    async execute(interaction) {
        // let ping = client.ws.ping
        await interaction.reply(`PONG , Client Ping : ${interaction.client.ws.ping}`)
    }
}