import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDB = async () => {
    try {
     const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`Database connected ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to database", error);
        // throw error;
        process.exit(1);
    }
};