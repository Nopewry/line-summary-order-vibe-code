import cron from "node-cron";
import db from "./db.js";

export function startCron(client, groupId) {
  cron.schedule(
    "0 20 * * *",
    async () => {
      const orders = db
        .prepare(
          `
          SELECT *
          FROM orders
          ORDER BY meal, order_type, menu
        `
        )
        .all();

      if (orders.length === 0) return;

      const meals = ["เช้า", "กลางวัน", "เย็น"];

      let text =
        `📦 Order ของวันพรุ่งนี้\n\n`;

      for (const meal of meals) {
        text += `🍽 ${meal}\n\n`;

        const riceOrders = orders.filter(
          o =>
            o.meal === meal &&
            o.order_type === "พร้อมข้าว"
        );

        const sideOrders = orders.filter(
          o =>
            o.meal === meal &&
            o.order_type === "กับข้าว"
        );

        text += "🍚 พร้อมข้าว\n";

        for (const item of riceOrders) {
          text += `• ${item.menu} - ${item.customer_name}\n`;
        }

        text += "\n🍱 กับข้าว\n";

        for (const item of sideOrders) {
          text += `• ${item.menu} - ${item.customer_name}\n`;
        }

        text += "\n";
      }

      await client.pushMessage({
        to: groupId,
        messages: [
          {
            type: "text",
            text
          }
        ]
      });

      db.prepare("DELETE FROM orders").run();
    },
    {
      timezone: "Asia/Bangkok"
    }
  );
}