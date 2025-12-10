import { SlashCommandBuilder, MessageFlags, ChatInputCommandInteraction } from "discord.js";
import mongoose from "mongoose";
const db = mongoose.connection;

export default {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Link your FreyrAds account with our discord server")
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("The verification code from the website")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString("code");

    if (!code) {
      return interaction.reply({
        content: "You must enter a verification code.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = await db.collection("discord_users").findOne({
      verification_code: code,
    });

    if (!user) {
      return interaction.reply({
        content: "Invalid verification code. Please regenerate it on the website.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const notLinked =
  !user.discord_user_id ||
  user.discord_user_id === "N/A" ||
  user.discord_user_id.trim() === "";

    if (!notLinked) {

      if (user.discord_user_id === interaction.user.id) {
        return interaction.reply({
          content: "Your FreyrAds account is already linked to your Discord!",
          flags: MessageFlags.Ephemeral,
        });
      }


      return interaction.reply({
        content:
          "This verification code is already linked to another Discord account. Please regenerate a new code from the website.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await db.collection("discord_users").updateOne(
      { verification_code: code },
      { $set: { discord_user_id: interaction.user.id } }
    );

    return interaction.reply({
      content: "Your Discord account has been successfully linked!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
