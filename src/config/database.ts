import mongoose from "mongoose";
import { logger } from "../shared/utils/logger";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error("MONGODB_URI is not set");
    throw new Error("MONGODB_URI is not set");
  }

  try {
    await mongoose.connect(mongoUri);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
};
