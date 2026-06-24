import express from "express";
import dotenv from "dotenv";
import * as line from "@line/bot-sdk";

import { handleEvent } from "./bot.js";
import { startCron } from "./cron.js";

dotenv.config();

const app = express();

const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken:
    process.env.CHANNEL_ACCESS_TOKEN
};

const client =
  new line.messagingApi.MessagingApiClient({
    channelAccessToken:
      config.channelAccessToken
  });

const middleware =
  line.middleware(config);

let latestGroupId = null;

app.post(
  "/webhook",
  middleware,
  async (req, res) => {
    for (const event of req.body.events) {
      if (
        event.source?.type === "group"
      ) {
        latestGroupId =
          event.source.groupId;
      }

      await handleEvent(event);
    }

    res.sendStatus(200);
  }
);

startCron(
  client,
  () => latestGroupId
);

app.get("/", (_, res) => {
  res.send("OK");
});

const port =
  process.env.PORT || 3000;

app.listen(port, () => {
  console.log(
    `Server running on ${port}`
  );
});