import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

import { handleEvent } from "./bot.js";
import { startCron } from "./cron.js";

dotenv.config();

const app = express();

console.log("🔥 SERVER STARTED");

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const middleware = line.middleware(config);

let latestGroupId = null;

// 🔥 DEBUG middleware error
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  next(err);
});

app.post("/webhook", async (req, res) => {
  console.log("🔥 WEBHOOK HIT");
  console.log("📦 BODY:", JSON.stringify(req.body, null, 2));

  try {
    const events = req.body?.events || [];

    if (!events.length) {
      console.log("⚠️ No events");
    }

    for (const event of events) {
      console.log("📩 EVENT:", event.type);

      if (event.source?.type === "group") {
        latestGroupId = event.source.groupId;
        console.log("👥 Group ID:", latestGroupId);
      }

      try {
        await handleEvent(event);
        console.log("✅ handleEvent success");
      } catch (err) {
        console.error("❌ handleEvent error:", err);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ WEBHOOK FATAL:", err);
    res.sendStatus(500);
  }
});

startCron(client, () => latestGroupId);

app.get("/", (_, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});