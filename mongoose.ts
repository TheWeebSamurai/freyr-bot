import mongoose from "mongoose";
import config from "./config";

async function connectDB() {
    try {
        await mongoose.connect(config.mongoose_url);
        console.log("USING DB:", mongoose.connection.name);
        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectDB();