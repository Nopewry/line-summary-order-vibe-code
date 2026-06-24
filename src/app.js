import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

import { handleEvent } from "./bot.js";
import { startCron } from "./cron.js";

dotenv.config();

const app = express();

// 🔥 MUST HAVE THIS
app.use(express.json());

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const middleware = line.middleware(config);

let latestGroupId = null;

app.post("/webhook", middleware, async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT");

    const events = req.body?.events || [];

    for (const event of events) {
      try {
        await handleEvent(event);
      } catch (err) {
        console.error("❌ handleEvent failed:", err);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ WEBHOOK CRASH:", err);
    res.sendStatus(200); // สำคัญ: ห้ามให้ LINE เห็น 500
  }
});

startCron(client, () => latestGroupId);

app.get("/", (_, res) => {
  res.send("OK");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});