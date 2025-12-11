import { Message, TextChannel } from "discord.js"
import ticketmodel from '../models/ticketmodel'
import { generateDiscordTranscript } from "../handlers/ticketCloseHandler"
import  fs from 'fs'
import path from 'path'
export default {
    name: "tfclose",
    async execute(message: Message, args: any[]) {
        let ticket_channel = message.channel as TextChannel
        if(!ticket_channel.name.startsWith("ticket-")) return;
        let check_for_ticket_model = await ticketmodel.findOne({ticket_channel_id: ticket_channel.id})
        if(!check_for_ticket_model) return;
        let reason = args.join(" ") || "NO REASON PROVIDED"
        check_for_ticket_model.ticket_close_reason = reason
        check_for_ticket_model.status = "CLOSED"

        const html = generateDiscordTranscript(check_for_ticket_model);
        const filePath = path.join(process.cwd(), "transcripts", `${check_for_ticket_model.ticket_id}.html`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, html);
        try {
            const user = await message.client.users.fetch(check_for_ticket_model.ticket_creator_id);
    
            await user.send({
                content: `📄 Your ticket has been closed.\n**Reason:** ${reason}`,
                files: [filePath]
            });
        } catch (err) {
            console.error("Could not DM user:", err);
        }
        

        await check_for_ticket_model.save()
        setTimeout(() => ticket_channel.delete().catch(() => {}), 1500);
    }
}