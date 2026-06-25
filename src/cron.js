import cron from "node-cron";
import db from "./db.js";
import { generateSummary } from "./summary.js";

export function startCron(client) {
  const groupId = process.env.GROUP_ID;
  console.log("📤 SEND TO", groupId);
  console.log("🕗 CRON STARTING");
  cron.schedule(
    "* * * * *",
    async () => {
      console.log("🕗 CRON RUNNING");
      const orders = db
        .prepare(
          `
          SELECT *
          FROM orders
          ORDER BY meal, order_type, menu
        `
        )
        .all();

      const text = generateSummary(orders);

      console.log("📤 PUSH MESSAGE");
      console.log(text);

      try {
        await client.pushMessage({
          to: groupId,
          messages: [
            {
              type: "text",
              text
            }
          ]
        });

        console.log("✅ PUSH SUCCESS");
      } catch (err) {
        console.error("❌ PUSH ERROR", err);
      }

      db.prepare("DELETE FROM orders").run();
      const rows = db
      .prepare("SELECT * FROM orders")
      .all();

      console.log(rows);
    },
    {
      timezone: "Asia/Bangkok"
    }
  );
}