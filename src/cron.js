import cron from "node-cron";
import db from "./db.js";

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