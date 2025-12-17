import { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, User } from "discord.js";
import { Client } from "discord.js";
import mongoose from "mongoose";
const db = mongoose.connection
export default {
    data: new SlashCommandBuilder().setName("give_coin").setDescription("Give's coins to a user").addUserOption(opt => opt.setName("target_user ").setRequired(true).setDescription("Please mention the user whom you want to add coins to ")).addNumberOption(opt => opt.setName("coin_amount").setDescription("How many coins do you want to give to the user?").setMinValue(1).setMaxValue(3).setRequired(true)),
    async execute(interaction: ChatInputCommandInteraction) {
        let mentioned_user = interaction.options.getUser("target_user") as User
        let amount_of_coins = interaction.options.getNumber("coin_amount")
        
        try {
            const user = await db.collection("discord_users").updateOne(
                {discord_user_id: mentioned_user!.id},
                {$inc: {coins: Number(amount_of_coins)}}
            );
            await interaction.deferReply({ ephemeral: true });
            if(user.matchedCount === 0) {
                return await interaction.followUp({content: "That user doesn't exist in the database this means the user doesn't have a freyr account or hasnt verified their account on discord"})
            }
            const embed = new EmbedBuilder()
            .setTitle(`The balance of <@${mentioned_user.id}>`)
            .setDescription(`The user has gained ${amount_of_coins} coins. Use \`/balance\` to check the balance.`)
            .setColor("White")
            .setFooter({text: "Powered by FreryAds", iconURL: "https://freyrads.xyz/assets/fav-BXx-N2um.png"})
            .setAuthor({name: "FreyrAds", iconURL: "https://freyrads.xyz/assets/fav-BXx-N2um.png"})
            await interaction.followUp({content: "The data has been succesfully updated!", embeds: [embed]})
        } catch(e) {
            console.log(e)
            await interaction.editReply({content: "Internal Server Error, Please check console for more details"})
        }


    }
}