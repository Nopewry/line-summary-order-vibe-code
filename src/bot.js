import db from "./db.js";
import { parseOrders } from "./parser.js";
import * as line from "@line/bot-sdk";
import { generateSummary } from "./summary.js";

const client =
  new line.messagingApi.MessagingApiClient({
    channelAccessToken:
      process.env.CHANNEL_ACCESS_TOKEN,
  });

export async function handleEvent(event) {
  console.log("🤖 handleEvent called");
  console.log("TEXT =", event.message?.text);
  try {
    if (event.type !== "message") return;

    if (event.message.type !== "text") return;

    if (event.source.type !== "group") return;

    const text = event.message.text;

    if (text === "#สรุป") {
      const orders = db
        .prepare(
          "SELECT * FROM orders ORDER BY meal, order_type"
        )
        .all();

      if (orders.length === 0) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "ยังไม่มีออเดอร์",
            },
          ],
        });

        return;
      }

      const summary = generateSummary(orders);

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: summary,
          },
        ],
      });

      return;
    }

    const cancelMatch = text.match(
      /^(.+?)\s*\|\s*ยกเลิก$/i
    );

    if (cancelMatch) {
      const customerName =
        cancelMatch[1].trim();

      const result = db.prepare(`
        DELETE FROM orders
        WHERE id = (
          SELECT id
          FROM orders
          WHERE customer_name = ?
          ORDER BY id DESC
          LIMIT 1
        )
      `).run(customerName);

      if (result.changes > 0) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text:
                `✅ ยกเลิกออเดอร์ของ ${customerName} แล้ว`
            }
          ]
        });
      } else {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text:
                `❌ ไม่พบออเดอร์ของ ${customerName}`
            }
          ]
        });
      }

      return;
    }

    const orders = parseOrders(text);
    // console.log("📋 PARSED ORDERS");
    // console.log(orders);

    if (orders.length === 0) return;

    const insertStmt = db.prepare(`
      INSERT INTO orders
      (
        group_id,
        customer_name,
        meal,
        order_type,
        menu
      )
      VALUES (?, ?, ?, ?, ?)
    `);


    console.log("💾 INSERTING ORDER");
    for (const order of orders) {
      console.log(order);
      insertStmt.run(
        event.source.groupId,
        order.customerName,
        order.meal,
        order.orderType,
        order.menu
      );
    }

    // const rows = db
    // .prepare("SELECT * FROM orders")
    // .all();

    // console.log("📦 ROWS IN DB");
    // console.log(rows);

    console.log("✅ DB INSERT SUCCESS");
  } catch (err) {
    console.error("BOT ERROR:", err);
  }
}