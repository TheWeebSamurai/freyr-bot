import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ModalBuilder, ActionRowBuilder, StringSelectMenuBuilder , TextInputBuilder, TextInputStyle, LabelBuilder, StringSelectMenuOptionBuilder, Interaction, AutocompleteInteraction, MessageFlags } from "discord.js";
import issueModel from "../../models/issueModel";
import { announceIssue, announceStatusChange } from "../../handlers/issueHandler";
export default {
    data: new SlashCommandBuilder()
    .setName("issue")
    .setDescription("status/issue related commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addSubcommand(option => option.setName("add").setDescription("Manually ad an issue"))
    .addSubcommand(option => option.setName("mark").setDescription("mark an issue").addStringOption(stropt => stropt.setName("issue_id").setRequired(true).setAutocomplete(true).setDescription("The ID of the issue")).addStringOption(strOpt => strOpt.setName("current_status").setDescription("current status of the issue").addChoices({name: "OPEN", value: "OPEN"}, {name: "FIXING", value: "FIXING"}, {name: "CLOSED", value: "CLOSED"}))),
    async execute (interaction: ChatInputCommandInteraction) {
        if(interaction.options.getSubcommand() === "add") {
            let newIssueModal = new ModalBuilder().setCustomId("manual_issue_modal").setTitle("Create a manual issue");
            const titleInput = new TextInputBuilder().setCustomId("issueTitleInput").setStyle(TextInputStyle.Short).setPlaceholder("Issue Title")
            const titleLabel = new LabelBuilder().setLabel("Issue Title").setDescription("Issue Title").setTextInputComponent(titleInput)

            const descInput = new TextInputBuilder().setCustomId("issueDescInput").setStyle(TextInputStyle.Paragraph).setPlaceholder("Issue Description")
            const descLabel = new LabelBuilder().setLabel("Issue Description").setDescription("Issue Description").setTextInputComponent(descInput)

            const issueType = new StringSelectMenuBuilder().setCustomId("issueTypeList").setPlaceholder("Please select the type of the issue!").setRequired(true)
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel("SIMPLE").setDescription("An issue that can be simply fixed! Non Issue Causing").setValue("simple"),
                new StringSelectMenuOptionBuilder().setLabel("MODERATE").setDescription("An issue that can be with some timefixed! Kind off Issue causing").setValue("moderate"),
                new StringSelectMenuOptionBuilder().setLabel("HEAVY").setDescription("An issue that takes some time to fix, needs fixing ASAP").setValue("heavy"),
                new StringSelectMenuOptionBuilder().setLabel("EXTREME").setDescription("An issue that can be simply fixed! CAUSES DOWNTIME").setValue("extreme"),
            )
            const issueLabel = new LabelBuilder().setLabel("Issue Type").setStringSelectMenuComponent(issueType)

            newIssueModal.addLabelComponents(titleLabel, descLabel, issueLabel)
            await interaction.showModal(newIssueModal)
        }

        if(interaction.options.getSubcommand() === "mark") {
            let issue_id = interaction.options.getString("issue_id")
            let current_status = interaction.options.getString("current_status")
            console.log(issue_id, current_status)
            let current_issue = await issueModel.findOne({issue_id})
            if(!current_issue) return await interaction.reply({content: "THAT ISSUE DOESNT EXIST", flags: MessageFlags.Ephemeral}) 
            if(current_issue.current_status === current_status!.toUpperCase()) return await interaction.reply({content: "THAT ISSUE IS ALREADY THAT STATUS PLEASE USE ANOTHER STATUS!", flags: MessageFlags.Ephemeral}) 
            current_issue.current_status = current_status!.toUpperCase() as "OPEN" | "FIXING" | "CLOSED";
            await current_issue.save()

            const changeStatModal = new ModalBuilder().setCustomId(`change_status_modal:${current_issue.issue_id}`).setTitle("Update the details of the modal")

            const titleInp = new TextInputBuilder().setCustomId("issue_status_title").setStyle(TextInputStyle.Short).setPlaceholder("Title for issue")
            const titleLabel = new LabelBuilder().setLabel("Title").setDescription("Please enter a title for transparency").setTextInputComponent(titleInp)

            const descInm = new TextInputBuilder().setCustomId("issue_status_desc").setStyle(TextInputStyle.Paragraph).setPlaceholder("Description")
            const descLabel = new LabelBuilder().setLabel("Description").setDescription("Please enter a description for transparency").setTextInputComponent(descInm)

            changeStatModal.addLabelComponents(titleLabel, descLabel)
            await interaction.showModal(changeStatModal);
        }
    },
    async autocomplete(interaction : AutocompleteInteraction) {
        const focused = interaction.options.getFocused()
        const current_issues = await issueModel.find({$or: [{current_status: "OPEN"}, {current_status: "FIXING"}]}).limit(10)

        const choices = current_issues.map(issue => ({
            name: `${issue.issue_id} - ${issue.issue_title} - [${issue.current_status}]`,
            value: issue.issue_id
        }))

        await interaction.respond(choices)
    }
}