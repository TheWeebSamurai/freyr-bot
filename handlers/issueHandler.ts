import { EmbedBuilder, TextChannel } from "discord.js";
import { Client } from "discord.js";
import issueModel from "../models/issueModel";
import config from "../config";

export function buildIssueEmbed(data: {
    id: string;
    title: string;
    description: string;
    severity: string;
    author?: any;
}) {
    return new EmbedBuilder()
        .setColor(getSeverityColor(data.severity))
        .setTitle(`🚨 New Issue Reported`)
        .addFields(
            { name: "🆔 Issue ID", value: data.id || "Unknown" },
            { name: "📝 Title", value: data.title || "No title provided" },
            { name: "📄 Description", value: data.description || "No description." },
            { name: "⚡ Severity", value: data.severity?.toUpperCase() || "N/A" }
        )
        .setTimestamp()
        .setThumbnail("https://freyrads.xyz/assets/fav-BXx-N2um.png")
        .setAuthor({name: data.author, iconURL: "https://freyrads.xyz/assets/fav-BXx-N2um.png"});

}

function getSeverityColor(severity: string) {
    switch (severity.toLowerCase()) {
        case "simple": return 0x2ecc71;
        case "moderate": return 0xf1c40f;
        case "heavy": return 0xe67e22;
        case "extreme": return 0xe74c3c;
        default: return 0x3498db;
    }
}



async function announceIssue(issue_id: string, client: Client) {
    const issue = await issueModel.findOne({ issue_id });
    if (!issue) return console.log("Issue not found:", issue_id);

    const issue_data = {
        id: issue.issue_id,
        title: issue.issue_title,
        description: issue.issue_description,
        severity: issue.issue_severity,
        author: issue.issue_author
    };

    const issue_embed = buildIssueEmbed(issue_data);

    const channel = await client.channels.fetch(config.issue_channel) as TextChannel;

    if (!channel || !channel.isTextBased()) {
        console.error("Configured issue channel is not a text-based channel.");
        return;
    }

    await channel.send({ embeds: [issue_embed] });

    console.log(`Issue ${issue_id} announced.`);
}


export async function announceStatusChange(
    issue_id: string,
    new_status: "OPEN" | "CLOSED" | "FIXING",
    client: Client,
    updates?: { newTitle?: string | null, newDesc?: string | null }
) {
    const issue = await issueModel.findOne({ issue_id });
    if (!issue) return;

    // Only update status
    function parseText(s) {
        switch (s) {
            case "OPEN":
                return "This issue is currently open! Please refer to the bottom section for more details"
                break;
            case "FIXING":
                return "This issue is currently being fixed! Please refer to the bottom section for more details"
                break;
            case "CLOSED":
                return "This issue has been fixed! Please refer to the bottom section for more details"
                break;
            default:
                break;
        }
    }

    let statusText = parseText(new_status)
    let followUpSection = "";

    if (updates?.newTitle || updates?.newDesc) {
        followUpSection =
            `\n### 📨 Follow-Up Update\n` +
            `${updates.newTitle ? `**New Title:** ${updates.newTitle}\n` : ""}` +
            `${updates.newDesc  ? `**New Description:**\n${updates.newDesc}\n` : ""}`;
    }

    const embed = new EmbedBuilder()
        .setColor(getStatusColor(new_status))
        .setAuthor({
            name: "Freyr | Issue Status Update",
            iconURL: "https://freyrads.xyz/assets/fav-BXx-N2um.png"
        })
        .setTitle(`🔄 Issue Status Updated`)
        .setThumbnail("https://freyrads.xyz/assets/fav-BXx-N2um.png")
        .setDescription(
            `### 🆔 Issue ID: \`${issue.issue_id}\`\n` +
            `### 📝 Original Title\n${issue.issue_title}\n\n` +
            `### 📄 Original Description\n${issue.issue_description}\n\n` +
            `### 🔀 New Status\n${statusText}\n` +
            followUpSection
        )
        .setTimestamp()
        .setFooter({ text: "Freyr Issue Management System" });

    const channel = await client.channels.fetch(config.issue_channel) as TextChannel;
    if (!channel || !channel.isTextBased()) return;

    await channel.send({ embeds: [embed] });
}


function getStatusColor(status: "OPEN" | "CLOSED" | "FIXING") {
    switch (status) {
        case "OPEN": return 0xe74c3c;    // green
        case "FIXING": return 0xf1c40f;  // yellow
        case "CLOSED": return  0x2ecc71;  // red
        default: return 0x3498db;
    }
}



export {
    announceIssue
}