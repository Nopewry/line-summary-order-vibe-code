import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";
import { handleEvent } from "./bot.js";
import { cleanup } from "./orderStore.js";

dotenv.config();

const app = express();

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

const middleware = line.middleware(config);

// cleanup memory ทุก 10 นาที
setInterval(() => cleanup(), 10 * 60 * 1000);

app.post("/webhook", middleware, async (req, res) => {
  try {
    await Promise.all(req.body.events.map(e => handleEvent(e, client)));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

app.get("/", (_, res) => {
  res.send("LINE Order Bot is running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});