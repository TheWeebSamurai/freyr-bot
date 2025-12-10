import {
    Interaction,
    TextChannel,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
    Events,
} from "discord.js";

import ticketmodel from "../models/ticketmodel";
import { generateDiscordTranscript } from "../handlers/ticketCloseHandler";
import fs from "fs";
import path from "path";

export default {
    name: Events.InteractionCreate,
    on: true,
    async execute(interaction: Interaction) {

        // ===============================
        // BUTTON HANDLING
        // ===============================
        if (interaction.isButton()) {

            // -----------------------------------------
            // CREATE TICKET BUTTON → OPEN MODAL
            // -----------------------------------------
            if (interaction.customId === "create_ticket_button") {

                const modal = new ModalBuilder()
                    .setCustomId("custom_ticket_modal")
                    .setTitle("Create New Ticket!");

                const titleInput = new TextInputBuilder()
                    .setCustomId("ticket_title")
                    .setLabel("Ticket Title")
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder("Short title for your issue")
                    .setRequired(true);

                const descInput = new TextInputBuilder()
                    .setCustomId("ticket_description")
                    .setLabel("Describe Your Issue")
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("Explain the issue in detail")
                    .setRequired(true);

                const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
                const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);

                modal.addComponents(row1, row2);

                return interaction.showModal(modal);
            }

            // -----------------------------------------
            // CLOSE TICKET BUTTON
            // -----------------------------------------
            if (interaction.customId === "ticket_close_button") {

                const closeModal = new ModalBuilder()
                    .setCustomId("close_ticket_modal")
                    .setTitle("Close Ticket");
            
                const reasonInput = new TextInputBuilder()
                    .setCustomId("ticket_close_reason")
                    .setLabel("Reason for Closing")
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder("Please state the reason for closing this ticket")
                    .setRequired(true);
            
                const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
                closeModal.addComponents(row);
            
                return interaction.showModal(closeModal);
            }
        }


        // ===============================
        // MODAL HANDLING
        // ===============================
        if (interaction.isModalSubmit()) {

            if (interaction.customId === "custom_ticket_modal") {
                const title = interaction.fields.getTextInputValue("ticket_title");
                const description = interaction.fields.getTextInputValue("ticket_description");

       
                const existingTicket = await ticketmodel.findOne({
                    ticket_creator_id: interaction.user.id,
                    status: "OPEN"
                });

                if (existingTicket) {
                    return interaction.reply({
                        content: "⚠️ You already have an open ticket!",
                        flags: MessageFlags.Ephemeral
                    });
                }

               
                const parentCategoryId = (interaction.channel as TextChannel)?.parentId;

                const newChannel = await interaction.guild?.channels.create({
                    name: `ticket-${interaction.user.id}`,
                    topic: interaction.user.id,
                    parent: parentCategoryId
                });

                if (!newChannel) {
                    return interaction.reply({
                        content: "❌ Failed to create ticket channel.",
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor("#5865F2")
                    .setAuthor({
                        name: `Ticket by ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setTitle(`🎫 ${title}`)
                    .setDescription(
                        `### 🧑 User\n${interaction.user}\n\n` +
                        `### 📝 Title\n${title}\n\n` +
                        `### 📄 Description\n${description}\n\n` +
                        "A staff member will assist you shortly."
                    )
                    .setTimestamp();

                const closeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("ticket_close_button")
                        .setLabel("Close Ticket")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Danger)
                );

                newChannel.send({
                    content: `${interaction.user}`,
                    embeds: [embed],
                    components: [closeButton]
                });

           
                const newTicket = await ticketmodel.create({
                    ticket_creator_id: interaction.user.id,
                    ticket_channel_id: newChannel.id,
                    ticket_id: `ticket-${interaction.user.id}`,
                    status: "OPEN",
                    ticket_title: title,
                    ticket_description: description
                });

                newTicket.users.push({
                    user_id: interaction.user.id,
                    user_name: interaction.user.username,
                    user_profile_picture: interaction.user.displayAvatarURL()
                });

                await newTicket.save();

                return interaction.reply({
                    content: `🎟️ Ticket created! Head over to <#${newChannel.id}>`,
                    flags: MessageFlags.Ephemeral
                });
            }


            
            
            if (interaction.customId === "close_ticket_modal") {

                const channel = interaction.channel as TextChannel;
                const reason = interaction.fields.getTextInputValue("ticket_close_reason");
            
                const ticket = await ticketmodel.findOne({
                    ticket_channel_id: channel.id,
                    status: "OPEN"
                });
            
                if (!ticket) {
                    return interaction.reply({
                        content: "❌ No open ticket found.",
                        ephemeral: true
                    });
                }
            
         
                const html = generateDiscordTranscript(ticket);
                const filePath = path.join(process.cwd(), "transcripts", `${ticket.ticket_id}.html`);
            
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, html);
            
          
                try {
                    const user = await interaction.client.users.fetch(ticket.ticket_creator_id);
            
                    await user.send({
                        content: `📄 Your ticket has been closed.\n**Reason:** ${reason}`,
                        files: [filePath]
                    });
                } catch (err) {
                    console.error("Could not DM user:", err);
                }
            

                ticket.status = "CLOSED";
                ticket.ticket_close_reason = reason;
                await ticket.save();
            
                // Acknowledge
                await interaction.reply({
                    content: `🔒 Ticket closed.\n**Reason:** ${reason}`,
                    ephemeral: true
                });
            
                // Delete channel
                setTimeout(() => channel.delete().catch(() => {}), 1500);
            }
            
        }
    }
};
