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
    AttachmentBuilder,
} from "discord.js";
import { randomUUID } from "crypto";
import ticketmodel from "../models/ticketmodel";
import { generateDiscordTranscript } from "../handlers/ticketCloseHandler";
import fs from "fs";
import path from "path";
import issueModal from "../models/issueModel";
import { announceIssue, announceStatusChange } from "../handlers/issueHandler";
import issueModel from "../models/issueModel";
import config from "../config";

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
                const ticketId = randomUUID()
                const newChannel = await interaction.guild?.channels.create({
                    name: `ticket-${ticketId}`,
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
                    .setDescription(description + "\n" + "**Staff will be with you shortly , please refrain from mass pinging**")
                    .setTimestamp();

                const closeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId("ticket_close_button")
                        .setLabel("Close Ticket")
                        .setEmoji("🔒")
                        .setStyle(ButtonStyle.Danger)
                );

                newChannel.send({
                    content: `${interaction.user} <@&1373603542874718210>`,
                    embeds: [embed],
                    components: [closeButton]
                });

                newChannel.permissionOverwrites.edit(interaction.user.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    AddReactions: true,
                    
                })

           
                const newTicket = await ticketmodel.create({
                    ticket_creator_id: interaction.user.id,
                    ticket_channel_id: newChannel.id,
                    ticket_id: `ticket-${ticketId}`,
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
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                const ticket = await ticketmodel.findOneAndUpdate({ticket_channel_id: channel.id, status: {$ne: "CLOSED"}}, {status: "CLOSED", ticket_close_reason: reason || "No Reason Provided", transcript_expiry: expiresAt}, {new: true});
            
                if (!ticket) {
                    return interaction.reply({
                        content: "❌ No open ticket found.",
                        ephemeral: true
                    });
                }

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

                const buttons = new ButtonBuilder().setLabel("Ticket Transcript").setEmoji("🎫").setStyle(ButtonStyle.Link).setURL(`https://tickets.freyrads.xyz/render-transcript/${ticket.ticket_id}`)
                const actionrow = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)
         
                const html = generateDiscordTranscript(ticket);
                const filePath = path.join(process.cwd(), "transcripts", `${ticket.ticket_id}.html`);
            
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, html);
                setTimeout(() => {
                    fs.unlink(filePath, () => {});
                  }, 24 * 60 * 60 * 1000);
          
                try {
                    const user = await interaction.client.users.fetch(ticket.ticket_creator_id);
            
                    await user.send({
                        content: `📄 Your ticket has been closed.\n**Reason:** ${reason}`,
                        embeds: [customEmbed],
                        components: [actionrow]
                    });

                    const attachment = new AttachmentBuilder(filePath, {
                        name: `ticket-${user.id}.html`
                    })
                    const ticket_log_channel = await interaction.client.channels.fetch(config.staff_ticket_log_id) as TextChannel
                    await ticket_log_channel.send({content: "🎫[Ticket-System] A ticket has been closed!", files: [attachment]})
                } catch (err) {
                    console.error("Could not DM user:", err);
                }
            


            
                // Acknowledge
                await interaction.reply({
                    content: `🔒 Ticket closed.\n**Reason:** ${reason}`,
                    ephemeral: true
                });
            
                // Delete channel
                setTimeout(() => channel.delete().catch(() => {}), 1500);
            }

            if(interaction.customId === "manual_issue_modal") {
                interaction.reply({content: "Issue has been added!", flags: MessageFlags.Ephemeral})
                const issue_title = interaction.fields.getTextInputValue("issueTitleInput")
                const issue_description = interaction.fields.getTextInputValue("issueDescInput")
                const issue_type = interaction.fields.getStringSelectValues("issueTypeList")
                
                console.log(issue_title, issue_description, issue_type[0].toUpperCase())

                let issue_created = await issueModal.create({
                    issue_title,
                    issue_description,
                    issue_severity: issue_type[0].toUpperCase(),
                    issue_author: interaction.user.username
                })
                await announceIssue(issue_created.issue_id, interaction.client)
            }

            if (interaction.customId.startsWith("change_status_modal")) {
                const [, issue_id] = interaction.customId.split(":");
            
                const newTitle = interaction.fields.getTextInputValue("issue_status_title");
                const newDesc = interaction.fields.getTextInputValue("issue_status_desc");
            
                const issue = await issueModel.findOne({ issue_id });
            
                if (!issue) {
                    return interaction.reply({
                        content: "Something went wrong!",
                        flags: MessageFlags.Ephemeral
                    });
                }
        
                await announceStatusChange(
                    issue.issue_id,
                    issue.current_status,
                    interaction.client,
                    {
                        newTitle: newTitle.trim() || null,
                        newDesc:  newDesc.trim() || null
                    }
                );
            
                return interaction.reply({
                    content: "Follow-up sent for this issue.",
                    flags: MessageFlags.Ephemeral
                });
            }
            
            
        }

        /// AUTOCOMPLETE HANDLING

        if(interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName)

            try {
                await command.autocomplete(interaction)
            } catch(err) {
                console.log(err)

            }
        }

    }
};
