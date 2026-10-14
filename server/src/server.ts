import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function main() {
  try {
    await connectDatabase();
    console.log(`[db] connected -> ${env.mongoUri}`);
  } catch (err) {
    console.error("[db] failed to connect. Is MongoDB running?");
    console.error(err);
    process.exit(1);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] SVConnect API listening on http://localhost:${env.port}`);
  });
}

main();
