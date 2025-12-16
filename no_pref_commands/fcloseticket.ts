import { Message, TextChannel , EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits} from "discord.js"
import ticketmodel from '../models/ticketmodel'
import { generateDiscordTranscript } from "../handlers/ticketCloseHandler"
import  fs from 'fs'
import path from 'path'
export default {
    name: "tfclose",
    async execute(message: Message, args: any[]) {
        let commandUser = message.member
        if(!commandUser?.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return;
        }
        let ticket_channel = message.channel as TextChannel
        if(!ticket_channel.name.startsWith("ticket-")) return;
        let check_for_ticket_model = await ticketmodel.findOne({ticket_channel_id: ticket_channel.id})
        if(!check_for_ticket_model) return;
        if (check_for_ticket_model.status === "CLOSED") return;

        let reason = args.join(" ") || "NO REASON PROVIDED"
        check_for_ticket_model.ticket_close_reason = reason
        check_for_ticket_model.status = "CLOSED"

        const html = generateDiscordTranscript(check_for_ticket_model);
        const filePath = path.join(process.cwd(), "transcripts", `${check_for_ticket_model.ticket_id}.html`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, html);

        setTimeout(() => {
            fs.unlink(filePath, () => {});
          }, 24 * 60 * 60 * 1000);

        const customEmbed = new EmbedBuilder()
        .setColor(0x7CFF00) // lime green
        .setTitle("🎟️ Freyr Ticket Manager")
        .setDescription(
          [
            "**Your ticket transcript is ready.**",
            "",
            "📄 Please download and store this transcript safely.",
            "⏳ **This link expires in 24 hours.**",
          ].join("\n")
        )
        .setFooter({
          text: "Freyr • Secure Ticket System",
        })
        .setTimestamp();

        const buttons = new ButtonBuilder().setLabel("Ticket Transcript").setEmoji("🎫").setStyle(ButtonStyle.Link).setURL(`https://tickets.freyrads.xyz/render-transcript/${check_for_ticket_model.ticket_creator_id}`)
        const actionrow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)
 

        try {
            const user = await message.client.users.fetch(check_for_ticket_model.ticket_creator_id);
    
            await user.send({
                content: `📄 Your ticket has been closed.\n**Reason:** ${reason}`,
                embeds: [customEmbed],
                components: [actionrow]
            });
        } catch (err) {
            console.error("Could not DM user:", err);
        }
        

        await check_for_ticket_model.save()
        setTimeout(() => ticket_channel.delete().catch(() => {}), 1500);
    }
}