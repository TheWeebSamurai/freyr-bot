import { Schema, model, Document } from "mongoose";

export interface IIssue extends Document {
    issue_title: string;
    issue_description: string;
    issue_id: string; // 10-digit number stored as a string
    issue_date: Date;
    issue_severity: "SIMPLE" | "MODERATE" | "HEAVY" | "EXTREME";
    issue_author: string;
    current_status: "OPEN" | "CLOSED" | "FIXING"
}

function generateIssueId(): string {
    // Always 10 digits, no leading zeros
    return String(Math.floor(1000000000 + Math.random() * 9000000000));
}

const IssueSchema = new Schema<IIssue>({
    issue_title: { type: String, required: true },
    issue_description: { type: String, required: true },

    issue_id: {
        type: String,
        required: true,
        unique: true,
        default: generateIssueId
    },

    issue_date: { type: Date, default: Date.now },

    issue_severity: {
        type: String,
        enum: ["SIMPLE", "MODERATE", "HEAVY", "EXTREME"],
        required: true
    },
    issue_author: {
        type: String,
        required: true
    },
    current_status: {
        type: String,
        enum: ["OPEN", "CLOSED", "FIXING"],
        default: "OPEN"
    }
});

export default model<IIssue>("Issue", IssueSchema);
