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
      /^(.+?)\s*\/\s*ยกเลิก$/i
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

    const viewMatch = text.match(
      /^(.+?)\s*\/\s*ดู$/i
    );

    if (viewMatch) {
      const customerName =
        viewMatch[1].trim();

      const orders = db.prepare(`
        SELECT *
        FROM orders
        WHERE customer_name = ?
        ORDER BY id
      `).all(customerName);

      if (orders.length === 0) {
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

        return;
      }

      let text =
        `📋 ออเดอร์ของ ${customerName}\n\n`;

      orders.forEach((order, index) => {
        text +=
          `${index + 1}. ` +
          `${order.meal} / ` +
          `${order.menu}\n`;
      });

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text
          }
        ]
      });

      return;
    }

    const deleteMatch = text.match(
      /^ลบ\s*\/\s*(.+?)\s*\/\s*(\d+)$/i
    );

    if (deleteMatch) {
      const customerName =
        deleteMatch[1].trim();

      const orderIndex =
        Number(deleteMatch[2]);

      const orders = db.prepare(`
        SELECT *
        FROM orders
        WHERE customer_name = ?
        ORDER BY id
      `).all(customerName);

      if (
        orderIndex < 1 ||
        orderIndex > orders.length
      ) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "❌ ลำดับไม่ถูกต้อง"
            }
          ]
        });

        return;
      }

      const targetOrder =
        orders[orderIndex - 1];

      db.prepare(`
        DELETE FROM orders
        WHERE id = ?
      `).run(targetOrder.id);

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text:
              `✅ ลบรายการ ${orderIndex} แล้ว`
          }
        ]
      });

      return;
    }

    const editMatch = text.match(
      /^แก้\s*\/\s*(.+?)\s*\/\s*(\d+)\s*\/\s*(.+?)\s*\/\s*(.+)$/i
    );

    if (editMatch) {
      const customerName =
        editMatch[1].trim();

      const orderIndex =
        Number(editMatch[2]);

      const meal =
        editMatch[3].trim();

      const orderType = "-";

      const menu =
        editMatch[4].trim();

      const orders = db.prepare(`
        SELECT *
        FROM orders
        WHERE customer_name = ?
        ORDER BY id
      `).all(customerName);

      if (
        orderIndex < 1 ||
        orderIndex > orders.length
      ) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "❌ ลำดับไม่ถูกต้อง"
            }
          ]
        });

        return;
      }

      const targetOrder =
        orders[orderIndex - 1];

      db.prepare(`
        UPDATE orders
        SET
          meal = ?,
          order_type = ?,
          menu = ?
        WHERE id = ?
      `).run(
        meal,
        orderType,
        menu,
        targetOrder.id
      );

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text:
              `✅ แก้ไขรายการ ${orderIndex} แล้ว`
          }
        ]
      });

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
    
    const validMeals = ["เช้า", "กลางวัน", "เย็น"];

    for (const order of orders) {
      console.log(order);

      if (!validMeals.includes(order.meal)) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `❌ ช่วงเวลาไม่ถูกต้อง: ${order.meal}\nใช้ได้แค่: เช้า / กลางวัน / เย็น`
            }
          ]
        });

        return; // หรือ break แล้วแต่ behavior ที่ต้องการ
      }

      insertStmt.run(
        event.source.groupId,
        order.customerName,
        order.meal,
        "-",
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