import mongoose from "mongoose";
import config from "./config";

async function connectDB() {
    try {
        await mongoose.connect(config.mongoose_url, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 60000,
            connectTimeoutMS: 30000,
            maxPoolSize: 10,
          });
        console.log("USING DB:", mongoose.connection.name);
        console.log("Connected to MongoDB!");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectDB();