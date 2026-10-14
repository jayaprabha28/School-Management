import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(uri = env.mongoUri): Promise<typeof mongoose> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
