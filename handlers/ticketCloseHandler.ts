import { ITicket } from "../models/ticketmodel";

/**
 * Generates a full Discord-like HTML transcript.
 * @param ticket Mongo Ticket Document
 * @returns HTML string
 */
export function generateDiscordTranscript(ticket: ITicket): string {
    const messagesHTML = ticket.messages
        .map(
            (msg) => `
        <div class="message">
            <img class="avatar" src="${msg.author_avatar}" />
            <div class="content">
                <div class="username">
                    ${escapeHTML(msg.author_name)}
                    <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div class="text">${escapeHTML(msg.content)}</div>
            </div>
        </div>
    `
        )
        .join("");

    const usersHTML = ticket.users
        .map(
            (u) => `
        <div class="user">
            <img src="${u.user_profile_picture}" />
            <span>${escapeHTML(u.user_name)}</span>
        </div>
    `
        )
        .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Ticket Transcript - ${escapeHTML(ticket.ticket_title || ticket.ticket_id)}</title>
<style>
    body {
        background-color: #2C2F33;
        color: #FFF;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        padding: 0;
    }

    .header {
        background-color: #23272A;
        padding: 16px 24px;
        border-bottom: 1px solid #111;
    }

    .header-title {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 4px;
    }

    .header-sub {
        font-size: 13px;
        color: #BBB;
        line-height: 1.4;
    }

    .wrapper {
        display: flex;
    }

    /* Users sidebar */
    .users {
        width: 260px;
        background-color: #202225;
        padding: 12px;
        border-right: 2px solid #111;
        height: calc(100vh - 70px);
        overflow-y: auto;
    }

    .users h3 {
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 14px;
        text-transform: uppercase;
        color: #AAA;
    }

    .user {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        margin-bottom: 6px;
        background: #2F3136;
        border-radius: 6px;
    }

    .user img {
        width: 28px;
        height: 28px;
        border-radius: 50%;
    }

    .user span {
        font-size: 14px;
    }

    /* Chat body */
    .chat {
        flex-grow: 1;
        padding: 18px 24px;
        overflow-y: auto;
        height: calc(100vh - 70px);
    }

    .message {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;
    }

    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        margin-right: 12px;
    }

    .content {
        max-width: 80%;
    }

    .username {
        font-weight: 600;
        font-size: 14px;
    }

    .timestamp {
        font-size: 11px;
        color: #AAA;
        margin-left: 6px;
    }

    .text {
        margin-top: 3px;
        white-space: pre-wrap;
        font-size: 14px;
    }

    .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        margin-left: 6px;
    }

    .badge-open {
        background-color: #3BA55D;
        color: #FFF;
    }

    .badge-closed {
        background-color: #ED4245;
        color: #FFF;
    }

    .badge-pending {
        background-color: #FAA81A;
        color: #000;
    }

    .meta-row {
        margin-top: 6px;
    }

    .label {
        font-weight: 600;
        font-size: 12px;
        color: #CCC;
    }

    .value {
        font-size: 13px;
        color: #EEE;
    }

    .description {
        margin-top: 4px;
        font-size: 13px;
        color: #DDD;
        white-space: pre-wrap;
    }
</style>
</head>

<body>

<div class="header">
    <div class="header-title">
        🎫 ${escapeHTML(ticket.ticket_title || "Ticket")}
        <span class="badge ${getStatusClass(ticket.status)}">${ticket.status}</span>
    </div>
    <div class="header-sub">
        <div class="meta-row">
            <span class="label">Ticket ID:</span>
            <span class="value">${escapeHTML(ticket.ticket_id)}</span>
        </div>
        <div class="meta-row">
            <span class="label">Channel ID:</span>
            <span class="value">${escapeHTML(ticket.ticket_channel_id)}</span>
        </div>
        <div class="meta-row">
            <span class="label">Creator ID:</span>
            <span class="value">${escapeHTML(ticket.ticket_creator_id)}</span>
        </div>
        <div class="meta-row">
            <span class="label">Opened At:</span>
            <span class="value">${new Date(ticket.opened_at).toLocaleString()}</span>
        </div>
        <div class="meta-row description">
            <span class="label">Description:</span><br/>
            ${escapeHTML(ticket.ticket_description || "No description provided.")}
        </div>
    </div>
</div>

<div class="wrapper">

    <div class="users">
        <h3>Users Involved</h3>
        ${usersHTML || "<span style='font-size:13px;color:#888;'>No users recorded.</span>"}
    </div>

    <div class="chat">
        ${messagesHTML || "<span style='font-size:14px;color:#888;'>No messages in this ticket.</span>"}
    </div>

</div>

</body>
</html>
`;

    return html;
}

/** Escape HTML to prevent formatting issues / XSS */
function escapeHTML(str: string | undefined | null): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function getStatusClass(status: ITicket["status"]): string {
    switch (status) {
        case "OPEN":
            return "badge-open";
        case "CLOSED":
            return "badge-closed";
        case "PENDING":
            return "badge-pending";
        default:
            return "";
    }
}
