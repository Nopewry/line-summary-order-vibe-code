import cron from "node-cron";
import { generateSummary } from "./summary.js";
import { getOrders, deleteOldOrders  } from "./sheet.js";
import { getTomorrow } from "./date.js";


export function startCron(client) {
  const groupId = process.env.GROUP_ID;
  console.log("📤 SEND TO", groupId);
  console.log("🕗 CRON STARTING");
  cron.schedule(
    "* * * * *",
    async () => {
      console.log("🕗 CRON RUNNING");
      const tomorrow = getTomorrow();

      const allOrders = await getOrders();

      console.log("GROUP_ID =", groupId);
      console.log("TOMORROW =", tomorrow);
      console.table(allOrders);

      const orders = (await getOrders()).filter(
        order =>
          order.group_id === groupId &&
          order.order_date === tomorrow
      );

      if (orders.length === 0) {
        console.log("No orders");
        return;
      }

      const text = generateSummary(orders, tomorrow);

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
        await deleteOldOrders();

        console.log("🗑 OLD ORDERS DELETED");
      } catch (err) {
        console.error("❌ PUSH ERROR", err);
      }
    },
    {
      timezone: "Asia/Bangkok"
    }
  );
}