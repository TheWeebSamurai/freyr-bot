import axios from "axios";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import config from "../../config";
import mongoose from "mongoose";

const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

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


      const db = mongoose.connection;
      const res = await db.collection("discord_users").updateOne(
        { discord_user_id: userId },
        { $inc: { coins: 2 } },
      );
      
      if (res.matchedCount === 0) {
        return interaction.editReply(
          "Please verify your FreyrAds account using `/verify <code>`.\nIf you do not have a FreyrAds account, make one at https://freyrads.xyz"
        );
      }

      await api.post("/rewards/discord/claim", {
        code,
        password: config.api_password,
      });

      cooldowns.set(userId, now + COOLDOWN_MS);
      setTimeout(() => cooldowns.delete(userId), COOLDOWN_MS);

      return interaction.editReply(
        "✅ You successfully claimed the code!\n💰 You gained **2 coins**.\n🎯 Collect **160 coins** to earn **$1.5 USD**."
      );
    } catch (err: any) {
      if (err?.response?.status === 400) {
        return interaction.editReply("⚠️ You have already claimed this code.");
      }

      if (err?.response?.status === 404) {
        return interaction.editReply("❌ This code is expired or invalid.");
      }

      return interaction.editReply(
        "🚨 Could not process your claim. Please try again later."
      );
    }
  },
};
