import cron from "node-cron";
import { generateSummary } from "./summary.js";
import { getOrders } from "./sheet.js";

export function startCron(client) {
  const groupId = process.env.GROUP_ID;
  console.log("📤 SEND TO", groupId);
  console.log("🕗 CRON STARTING");
  cron.schedule(
    "0 22 * * *",
    async () => {
      console.log("🕗 CRON RUNNING");
      const orders = await getOrders();

      if (orders.length === 0) {
        console.log("No orders");
        return;
      }

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
    },
    {
      timezone: "Asia/Bangkok"
    }
  );
}