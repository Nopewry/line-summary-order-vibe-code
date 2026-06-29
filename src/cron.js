import cron from "node-cron";
import { generateSummary } from "./summary.js";
import {
  getOrders,
  deleteOldOrders,
} from "./sheet.js";
import { getTomorrow } from "./date.js";

export function startCron(client) {
  const groupIds = [
    process.env.GROUP_ID_MAIN,
    process.env.GROUP_ID_TEST,
  ];

  console.log("🕗 CRON STARTING");

  cron.schedule(
    "0 22 * * *",
    async () => {
      console.log("🕗 CRON RUNNING");

      const tomorrow = getTomorrow();

      for (const groupId of groupIds) {
        console.log("📤 SEND TO", groupId);

        const orders = (await getOrders(groupId)).filter(
          order => order.order_date === tomorrow
        );

        if (orders.length === 0) {
          console.log(`No orders : ${groupId}`);
          continue;
        }

        const text = generateSummary(
          orders,
          tomorrow
        );

        console.log("📤 PUSH MESSAGE");
        console.log(text);

        try {
          await client.pushMessage({
            to: groupId,
            messages: [
              {
                type: "text",
                text,
              },
            ],
          });

          console.log(`✅ PUSH SUCCESS : ${groupId}`);

          await deleteOldOrders(groupId);

          console.log(`🗑 OLD ORDERS DELETED : ${groupId}`);
        } catch (err) {
          console.error(
            `❌ PUSH ERROR : ${groupId}`,
            err
          );
        }
      }
    },
    {
      timezone: "Asia/Bangkok",
    }
  );
}