import { ActionRowBuilder, AutoModerationActionExecution, AutoModerationRuleKeywordPresetType, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, EmbedBuilder, Interaction, InteractionCallback, SlashCommandBuilder, TextChannel } from "discord.js";
import { Client } from "discord.js";
export default {
    data: new SlashCommandBuilder().setName("ticket_create").setDescription("Create the initial ticket! [FOR ADMINS]"),
    async execute(interaction: ChatInputCommandInteraction) {
        // let ping = client.ws.ping
        // await interaction.reply(`PONG , Client Ping : ${interaction.client.ws.ping}`)

        const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
            .setCustomId("create_ticket_button")
            .setLabel("Create Ticket")
            .setEmoji('🎫')
            .setStyle(ButtonStyle.Primary)
        )

        const embed = new EmbedBuilder()
        .setColor("#2F3136")
        .setTitle("🎟️ Create a Support Ticket")
        .setDescription(
            "Need help? We're here for you!\n\n" +
            "Click the button below to open a new ticket. " +
            "Our support team will respond as soon as possible.\n\n" +
            "📌 **Please do not open multiple tickets.**"
        )
        .setThumbnail("https://cdn-icons-png.flaticon.com/512/2991/2991148.png")
        .setFooter({
            text: "Support Ticket System",
            iconURL: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
        })
        .setTimestamp();

        const channel = interaction.channel as TextChannel
    
        const msg = await channel.send({embeds: [embed], components: [row]})
    }
}