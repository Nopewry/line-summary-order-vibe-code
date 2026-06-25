import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

import { handleEvent } from "./bot.js";
import { startCron } from "./cron.js";

dotenv.config();

const app = express();

// 🔥 MUST HAVE THIS
// app.use(express.json());

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};


const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const middleware = line.middleware(config);


app.post("/test", (req, res) => {
  console.log("TEST HIT");
  res.sendStatus(200);
});

app.post("/webhook", middleware, async (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  for (const event of req.body.events) {
    console.log("BEFORE handleEvent");

    await handleEvent(event);

    console.log("AFTER handleEvent");
  }

  return res.sendStatus(200);
});

startCron(client);

app.get("/", (_, res) => {
  res.send("OK");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});