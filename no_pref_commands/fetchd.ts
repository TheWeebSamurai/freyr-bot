import { Message, TextChannel, ChannelType, EmbedBuilder } from "discord.js";
import axios from "axios";
import config from "../config.js";
import mongoose from "mongoose";
const db = mongoose.connection
axios.defaults.baseURL = "https://scraper.133713373.xyz"
export default {
    name: "fetchd",
    async execute(message: Message, args: any[]) {
        await message.delete()
        const channel = message.channel as TextChannel;
        let anothrMsg;
        if (channel.type !== ChannelType.GuildText)
            return channel.send("This command can only be ran on servers!");

        const ticket_creator_id = channel.topic;
        if (!ticket_creator_id)
            return channel.send("No ticket user id found in channel topic.");

        const redis = message.client.redis;

        try {
            console.log("Ticket user id:", ticket_creator_id);
            if(!channel.topic) return channel.send({content: "This command is only usable in channels created by the bot!"})
            
    const user: any = await db.collection("discord_users").findOne({
        discord_user_id: channel.topic,
      });

      const embed = new EmbedBuilder()
  .setColor("#4363f2")
  .setTitle(`🧾 User Information [Basic Information]`)
  .setDescription(`Linked account details for this ticket.`)
  .addFields(
    { name: "👤 Username", value: user.freyr_user_name || "N/A", inline: true },
    { name: "🪪 Freyr ID", value: user.freyr_id || "N/A", inline: true },
    { name: "📧 Email", value: user.email || "N/A" },

    { name: "📸 Instagram", value: user.instagram_username || "Not set", inline: true },
    { name: "▶️ YouTube", value: user.youtube_username || "Not set", inline: true },

    { name: "🔑 Verification Code", value: user.verification_code || "N/A", inline: false },
    { name: "📅 Created At", value: `<t:${Math.floor(new Date(user.createdAt).getTime() / 1000)}:F>` }
  )
  .setFooter({ text: "FreyrAds User Record" })
  .setTimestamp();


            await channel.send({embeds: [embed]})
            anothrMsg = await channel.send("Fetching data from cache/scraper , please wait!")

            const cacheKey = `user_id:${ticket_creator_id}`;
            const cached = await redis.get(cacheKey);

            if (cached) {
                console.log("CACHE:", JSON.parse(cached));
                let caching = JSON.parse(cached)
                console.log(JSON.parse(cached))

                const cacheembed = new EmbedBuilder()
  .setColor("#ff0050") // TikTok pink
  .setTitle(`🎵 Instagram Profile: ${caching.display_name}`)
  .setURL(`https://www.instagram.com/${caching.user_name}`)
  .addFields(
    {
      name: "👤 Username",
      value: `@${caching.user_name}`,
      inline: true
    },
    {
      name: "🌟 Display Name",
      value: caching.display_name || "N/A",
      inline: true
    },
    {
      name: "📊 Followers",
      value: caching.follower_count || "0",
      inline: true
    },
    {
      name: "👥 Following",
      value: caching.following_count || "0",
      inline: true
    },
    {
      name: "🎬 Total Videos",
      value: caching.total_videos || "0",
      inline: true
    }
  )
  .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/1200px-Instagram_logo_2016.svg.png")
  .setFooter({ text: "TikTok Scraper • FreyrAds" })
  .setTimestamp();

            try {
              anothrMsg.delete().then(()=> {
                return channel.send({embeds: [cacheembed]});

            })
            } catch (err) {
    console.error(err);

    if (anothrMsg) {
        anothrMsg.delete().catch(() => {});
    }

    const errorEmbed = new EmbedBuilder()
        .setColor("#ff4d4d")
        .setTitle("⚠️ Scraper Offline")
        .setDescription("Something went wrong while fetching scraper data...")
        .setTimestamp();

    let test = await channel.send({ embeds: [errorEmbed] });

    setTimeout(() => {
        test.delete().catch(() => {});
    }, 5000);
}         

                
            }

            const res = await axios.post("/retrieveData", {
                password: config.api_key,
                user_id: ticket_creator_id,
            });

            const txtRes = JSON.stringify(res.data);
            console.log(res.data);

        const bomboData = new EmbedBuilder()
        .setColor("#ff0050") // TikTok pink
        .setTitle(`📷Instagram Profile: ${res.data.display_name}`)
        .setURL(`https://www.instagram.com/${res.data.user_name}`)
        .addFields(
            {
            name: "👤 Username",
            value: `@${res.data.user_name}`,
            inline: true
            },
            {
            name: "🌟 Display Name",
            value: res.data.display_name || "N/A",
            inline: true
            },
            {
            name: "📊 Followers",
            value: res.data.follower_count || "0",
            inline: true
            },
            {
            name: "👥 Following",
            value: res.data.following_count || "0",
            inline: true
            },
            {
            name: "🎬 Total Videos",
            value: res.data.total_videos || "0",
            inline: true
            }
        )
        .setThumbnail("https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Instagram_logo.svg/1024px-Instagram_logo.svg.png")
        .setFooter({ text: "Instagram Scraper • FreyrAds" })
        .setTimestamp();



            await redis.set(cacheKey, txtRes, 60 * 1000);

           anothrMsg.delete().then(() => {
            return channel.send({embeds: [bomboData]});
           })
        } catch (err) {
            console.error(err);
            const errorEmbed = new EmbedBuilder()
  .setColor("#ff4d4d")
  .setTitle("⚠️ Scraper Offline")
  .setDescription(
    "**Something went wrong while fetching scraper data.**\n" +
    "The server might be offline or temporarily unreachable and no cache was found!."
  )
  .addFields(
    {
      name: "Possible Causes",
      value:
        "• Scraper backend is down\n" +
        "• Network issue\n" +
        "• Rate limits or timeout",
    }, 
    {
      name: "Next Steps",
      value: "Please try again in a few moments.",
    }
  )
  .setFooter({ text: "FreyrAds System Notification" })
  .setTimestamp();

let test = channel.send({ embeds: [errorEmbed] });
setTimeout(() => {
test.then(test => {
    test.delete()
})
}, 5000)
        }
    },
};
