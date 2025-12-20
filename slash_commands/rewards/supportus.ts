import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ComponentBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageActionRowComponentBuilder,
    MessageFlags
  } from "discord.js";
  import axios from "axios";
  import crypto from "crypto";
  import { api_password } from "../../config";
  
  const cooldown = new Map<string, number>();
  const COOLDOWN_TIME = 1000 * 60 * 60 * 23; // 23 hours
  
  const api = axios.create({
    baseURL: "https://rewards.freyrads.xyz",
  });
  
  export default {
    data: new SlashCommandBuilder()
      .setName("supportus")
      .setDescription("[optional] Complete an ad and earn some coins"),
  
    async execute(interaction: ChatInputCommandInteraction) {
      const userId = interaction.user.id;
      const now = Date.now();
  
      const cooldownEnd = cooldown.get(userId);
      if (cooldownEnd && cooldownEnd > now) {
        const remaining = Math.ceil((cooldownEnd - now) / 1000);
      if(remaining >= 3600) {
        interaction.reply({
          content: `⏳ You are currently on cooldown for **${Math.floor(remaining/3600)}h ${Math.floor((remaining%3600)/60)}m ${remaining%60}s**.`,
          flags: MessageFlags.Ephemeral
        })
      } else if(remaining >= 60) {
        interaction.reply({content: `⏳ You are currently on cooldown for **${Math.floor(remaining/60)}m ${remaining%60}s**.`, flags: MessageFlags.Ephemeral})
      } else {
        interaction.reply({content: `⏳ You are currently on cooldown for **${remaining}s**.`, flags: MessageFlags.Ephemeral})
      }
      }
  
      await interaction.deferReply({ ephemeral: true });
  
      try {
        const rewardCode = crypto.randomBytes(7).toString("hex");
  
        const response = await api.post("/discord_bot/admin/create_link", {
          code: rewardCode,
          password: api_password,
          discord_user_id: userId
        });
  
        const rewardLink = response.data.link;
  
        cooldown.set(userId, now + COOLDOWN_TIME);
        setTimeout(() => cooldown.delete(userId), COOLDOWN_TIME);
  
        const embed = new EmbedBuilder()
          .setTitle("💜 Support Freyr & Earn Rewards")
          .setDescription(
            [
              "By completing a short sponsored offer, you help keep **Freyr Ads** running ❤️",
              "",
              "🎁 **Reward:** `+2 coins`",
              "💰 **200 coins = $1.7 USD payout`**",
              "",
              "Click the button below to continue:",
            ].join("\n")
          )
          .setColor(0x7c7cff)
          .setThumbnail("https://freyrads.xyz/assets/fav-BXx-N2um.png")
          .setFooter({
            text: "Rewards reset every 23 hours",
          })
          .setTimestamp();
        const button = new ButtonBuilder().setEmoji("😊").setLabel("Watch an ad to support us!").setURL(rewardLink).setStyle(ButtonStyle.Link)
        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(button)
  
        return interaction.editReply({
          embeds: [embed],
          content: `🔗 **Hey there this is completely optional just so you know but thanks for supporting us :D, It takes Less than 2 minutes to complete and it helps us a lot**`,
          components: [row],
        });
  
      } catch (err: any) {
        console.error("SupportUs error:", err);
  
        return interaction.editReply({
          content:
            "🚨 Failed to generate your reward link. Please try again later.",
        });
      }
    },
  };
  