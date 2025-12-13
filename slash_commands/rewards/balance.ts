import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
  } from "discord.js";
  import mongoose from "mongoose";
  
  const db = mongoose.connection;
  
  export default {
    data: new SlashCommandBuilder()
      .setName("balance")
      .setDescription("Check your coin balance!"),
  
    async execute(interaction: ChatInputCommandInteraction) {
      await interaction.deferReply({ ephemeral: true });
  
      const user = await db.collection("discord_users").findOne({
        discord_user_id: interaction.user.id,
      });
  
      // If user not found
      if (!user) {
        return interaction.editReply({
          content: "❌ You don’t have an account yet. Use `/supportus` to get started!",
        });
      }
  
      const balance = user.coins ?? 0;

      const embed = new EmbedBuilder()
        .setTitle("💰 Your Balance")
        .setDescription(
          [
            `👤 **User:** <@${interaction.user.id}>`,
            "",
            `🪙 **Coins:** **${balance.toLocaleString()}**`,
            "",
            "🎯 **100 coins = $1.5 USD**",
          ].join("\n")
        )
        .setColor(0x7c7cff)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
        .setFooter({
          text: "Earn more coins by supporting us ❤️",
        })
        .setTimestamp();
  
      return interaction.editReply({
        embeds: [embed],
      });
    },
  };
  