import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/svconnect_app",
  jwtSecret: process.env.JWT_SECRET || "svconnect-dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || "admin@svconnect.test",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || "Admin@123",
};

export const isProd = env.nodeEnv === "production";
