import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, User } from "discord.js";
import { Client } from "discord.js";
import mongoose from "mongoose";
const db = mongoose.connection
export default {
    data: new SlashCommandBuilder().setName("give_coin").setDescription("Give's coins to a user").addUserOption(opt => opt.setName("target_user").setRequired(true).setDescription("Please mention the user whom you want to add coins to ")).addNumberOption(opt => opt.setName("coin_amount").setDescription("How many coins do you want to give to the user?").setMinValue(1).setMaxValue(3).setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        const mentioned_user = interaction.options.getUser("target_user", true);
        const amount_of_coins = interaction.options.getNumber("coin_amount", true);
        try {
            const result = await db.collection("discord_users").updateOne(
                { discord_user_id: mentioned_user.id },
                { $inc: { coins: amount_of_coins } }
            );
            if (result.matchedCount === 0) {
                return interaction.reply({
                    content: "That user doesn't exist in the database. They may not have verified their Freyr account.",
                    ephemeral: true,
                });
            }
            const embed = new EmbedBuilder()
                .setTitle(`Balance Updated`)
                .setDescription(
                    `${mentioned_user} has gained **${amount_of_coins} coins**!\nUse \`/balance\` to check the balance.`
                )
                .setColor("White")
                .setFooter({
                    text: "Powered by FreyrAds",
                    iconURL: "https://freyrads.xyz/assets/fav-BXx-N2um.png",
                })
                .setAuthor({
                    name: "FreyrAds",
                    iconURL: "https://freyrads.xyz/assets/fav-BXx-N2um.png",
                });
            await interaction.reply({
                content: "✅ Coins successfully added!",
                embeds: [embed],
            });
    
        } catch (e) {
            console.error(e);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    content: "❌ Internal Server Error. Check console for details.",
                });
            } else {
                await interaction.reply({
                    content: "❌ Internal Server Error. Check console for details.",
                    ephemeral: true,
                });
            }
        }
    }
    
}

//beautified using chatgpt