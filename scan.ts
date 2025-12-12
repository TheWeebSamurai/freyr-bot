import axios from "axios";
import issueModel from "./models/issueModel";
import { announceIssue, announceStatusChange } from "./handlers/issueHandler";
import type { Client } from "discord.js";

const WEBSITES = [
    { name: "Main Website", url: "https://freyrads.xyz" },
    { name: "API Server", url: "https://api.freyrads.xyz/" },
    { name: "Dashboard", url: "https://dashboard.freyrads.xyz" },
    { name: "Scraper", url: "https://scraper.example.com" }
];

/**
 * Runs every 5 minutes
 */
export function startWebsiteMonitor(client: Client) {
    console.log("[Monitor] Website uptime checker started.");

    setInterval(async () => {
        for (const site of WEBSITES) {
            await checkWebsite(site, client);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Checks status of website
 */
async function checkWebsite(
    site: { name: string; url: string },
    client: Client
) {
    try {
        await axios.get(site.url, { timeout: 5000 });
        await handleSiteUp(site, client);
    } catch {
        await handleSiteDown(site, client);
    }
}

/**
 * Handles DOWN detection
 */
async function handleSiteDown(
    site: { name: string; url: string },
    client: Client
) {
    // Check if an active (non-closed) issue exists
    const activeIssue = await issueModel.findOne({
        issue_title: site.name,
        current_status: { $ne: "CLOSED" }
    });

    if (activeIssue) {
        console.log(`[Monitor] ${site.name} is still DOWN (existing issue: ${activeIssue.issue_id})`);
        return; // DO NOT CREATE DUPLICATES
    }

    // Create NEW issue because:
    // - no issue exists OR
    // - last issue is closed → new downtime event
    const newIssue = await issueModel.create({
        issue_title: site.name,
        issue_description: `${site.name} appears to be offline or unreachable.`,
        issue_severity: "EXTREME",
        issue_author: "System Monitor"
    });

    console.log(`[Monitor] Created NEW downtime issue ${newIssue.issue_id} for ${site.name}`);

    await announceIssue(newIssue.issue_id, client);
}

/**
 * Handles UP recovery
 */
async function handleSiteUp(
    site: { name: string; url: string },
    client: Client
) {
    // Only close issues that are OPEN or FIXING
    const activeIssue = await issueModel.findOne({
        issue_title: site.name,
        current_status: { $in: ["OPEN", "FIXING"] }
    });

    if (!activeIssue) return; // Nothing to close

    // Close it
    activeIssue.current_status = "CLOSED";
    await activeIssue.save();

    console.log(`[Monitor] Site restored: ${site.name}, closed issue ${activeIssue.issue_id}`);

    await announceStatusChange(
        activeIssue.issue_id,
        "CLOSED",
        client,
        {
            newTitle: "Site is now ONLINE",
            newDesc: `${site.name} has recovered and is functioning normally.`
        }
    );
}
