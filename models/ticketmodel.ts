import { Schema, model, Document } from "mongoose";

export interface IUsersTakingPart {
    user_name: string;
    user_id: string;
    user_profile_picture: string;
}

export interface IMessage {
    author_id: string;
    author_name: string;
    author_avatar: string;
    content: string;
    timestamp: Date;
}

export interface ITicket extends Document {
    ticket_id: string;
    ticket_channel_id: string;
    ticket_creator_id: string;
    ticket_title: string;
    ticket_description: string;
    users: IUsersTakingPart[];
    messages: IMessage[];
    status: "OPEN" | "CLOSED" | "PENDING";
    opened_at: Date;
    ticket_close_reason: string;
}


const UsersTakingPartSchema = new Schema<IUsersTakingPart>({
    user_name: String,
    user_id: String,
    user_profile_picture: String
});

const MessageSchema = new Schema<IMessage>({
    author_id: String,
    author_name: String,
    author_avatar: String,
    content: String,
    timestamp: { type: Date, default: Date.now }
});

const TicketSchema = new Schema<ITicket>({
    ticket_id: String,
    ticket_channel_id: String,
    ticket_creator_id: String,
    users: [UsersTakingPartSchema],
    messages: [MessageSchema],
    status: { type: String, enum: ["OPEN", "CLOSED", "PENDING"], default: "OPEN" },
    opened_at: { type: Date, default: Date.now },
    ticket_title: String,
    ticket_description: String,
    ticket_close_reason: {type: String, default: null}
});

export default model<ITicket>("Ticket", TicketSchema);
