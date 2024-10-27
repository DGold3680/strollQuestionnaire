import dotenv from "dotenv";
import mongoose from "mongoose";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connected`);
  } catch (err) {
    console.error(`Error: ${err}`);
    process.exit(1);
  }
};