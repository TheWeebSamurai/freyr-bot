import { Message, TextChannel } from "discord.js"
import ticketmodel from '../models/ticketmodel'
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
        await check_for_ticket_model.save()
    }
}