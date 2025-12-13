import axios from "axios";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import config from "../../config";
import mongoose from 'mongoose'
const db = mongoose.connection;

const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 24 * 60 * 60 * 1000

const api = axios.create({
  baseURL: "https://rewards.freyrads.xyz",
});

export default {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim a reward using the code from our website! do /supportus")
    .addStringOption(opt =>
      opt
        .setName("code")
        .setDescription("Please enter the code that you were provided")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const now = Date.now();

    const cooldownEnd = cooldowns.get(userId);
    if (cooldownEnd && cooldownEnd > now) {
      const remaining = Math.ceil((cooldownEnd - now) / 1000);
      return interaction.reply({
        content: `⏳ You are on cooldown. Try again in **${remaining}s**.`,
        ephemeral: true,
      });
    }

    const code = interaction.options.getString("code", true);

    await interaction.deferReply({ ephemeral: true });

    try {
      const res = await api.post("/rewards/discord/claim", {
        code,
        password: config.api_password,
      });

      cooldowns.set(userId, now + COOLDOWN_MS);
      setTimeout(() => cooldowns.delete(userId), COOLDOWN_MS);

      
    const user = await db.collection("discord_users").findOne({
        discord_user_id: interaction.user.id,
      });
      if(!user) return await interaction.editReply({content: "Please verify your FreyrAds account using `/verify <code>` if you do not have a FreyrAds accound make one at https://freyrads.xyz"})
        user.coins += 2
      await user.save()
      return interaction.editReply(
        "✅ You successfully claimed the code!\n💰 You gained **2 coins**.\n🎯 Collect **100 coins** to earn **$1.5 USD**."
      );

      

    } catch (err: any) {
      if (err.response) {
        switch (err.response.status) {
          case 400:
            return interaction.editReply(
              "⚠️ You have already claimed this code."
            );
          case 404:
            return interaction.editReply(
              "❌ This code is expired or already used."
            );
          default:
            return interaction.editReply(
              "🚨 Internal server error. Please try again later."
            );
        }
      }

      return interaction.editReply(
        "🚨 Could not reach reward server. Please try again later."
      );
    }
  },
};

//Beautifed using gpt5.1