import { parseOrders } from "./parser.js";
import * as line from "@line/bot-sdk";
import { generateSummary } from "./summary.js";

import { addOrder, getOrders } from "./sheet.js";

import { getToday, getTomorrow } from "./date.js";

console.log(process.env.SPREADSHEET_ID);

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
});

export async function handleEvent(event) {
  console.log("🤖 handleEvent called");
  console.log("TEXT =", event.message?.text);
  try {
    if (event.type !== "message") return;

    if (event.message.type !== "text") return;

    if (event.source.type !== "group") return;

    const text = event.message.text;

    if (text === "#สรุป" || text === "พน. / #สรุป") {
      const targetDate = text === "พน. / #สรุป" ? getTomorrow() : getToday();

      const orders = await getOrders();

      const groupOrders = orders.filter(
        order =>
          order.group_id === event.source.groupId &&
          order.order_date === targetDate
      );

      if (groupOrders.length === 0) {
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

      const summary = generateSummary(groupOrders, targetDate);

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

    const viewMatch = text.match(/^(?:(พน\.)\s*\/\s*)?(.+?)\s*\/\s*ดู$/i);

    if (viewMatch) {
      const isTomorrow = !!viewMatch[1];

    const customerName =
      viewMatch[2].trim();

    const targetDate =
      isTomorrow
        ? getTomorrow()
        : getToday();

      const orders = (await getOrders()).filter(
        (order) =>
          order.group_id === event.source.groupId &&
          order.customer_name === customerName && order.order_date === targetDate,
      );

      if (orders.length === 0) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: `❌ ไม่พบออเดอร์ของ ${customerName}`,
            },
          ],
        });

        return;
      }

      let text = `📋 ออเดอร์${isTomorrow ? "วันพรุ่งนี้" : "วันนี้"}ของ ${customerName}\n\n`;

      orders.forEach((order, index) => {
        text += `${index + 1}. ` + `${order.meal} / ` + `${order.menu}\n`;
      });

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text,
          },
        ],
      });

      return;
    }

    const deleteMatch = text.match(/^(?:(พน\.)\s*\/\s*)?ลบ\s*\/\s*(.+?)\s*\/\s*(\d+)$/i);

    if (deleteMatch) {
      const isTomorrow = !!deleteMatch[1];

    const customerName =
      deleteMatch[2].trim();

    const orderIndex =
      Number(deleteMatch[3]);

    const targetDate =
      isTomorrow
        ? getTomorrow()
        : getToday();

      const orders = (await getOrders()).filter(
        order =>
          order.group_id === event.source.groupId &&
          order.customer_name === customerName &&
          order.order_date === targetDate
      );

      if (orderIndex < 1 || orderIndex > orders.length) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "❌ ลำดับไม่ถูกต้อง",
            },
          ],
        });

        return;
      }

      const targetOrder = orders[orderIndex - 1];

      await targetOrder.row.delete();

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `✅ ลบรายการที่ ${orderIndex} ของ${isTomorrow ? "วันพรุ่งนี้" : "วันนี้"}แล้ว`,
          },
        ],
      });

      return;
    }

    const editMatch = text.match(
      /^(?:(พน\.)\s*\/\s*)?แก้\s*\/\s*(.+?)\s*\/\s*(\d+)\s*\/\s*(.+?)\s*\/\s*(.+)$/i,
    );

    if (editMatch) {
      const isTomorrow = !!editMatch[1];

      const customerName = editMatch[2].trim();

      const orderIndex = Number(editMatch[3]);

      const meal = editMatch[4].trim();

      const menu = editMatch[5].trim();

      const targetDate =
        isTomorrow
          ? getTomorrow()
          : getToday();

      const orders = (await getOrders()).filter(
        order =>
          order.group_id === event.source.groupId &&
          order.customer_name === customerName &&
          order.order_date === targetDate
      );

      if (orderIndex < 1 || orderIndex > orders.length) {
        await client.replyMessage({
          replyToken: event.replyToken,
          messages: [
            {
              type: "text",
              text: "❌ ลำดับไม่ถูกต้อง",
            },
          ],
        });

        return;
      }

      const targetOrder = orders[orderIndex - 1];

      targetOrder.row.set("meal", meal);
      targetOrder.row.set("menu", menu);

      await targetOrder.row.save();

      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `✅ แก้ไขรายการ ${orderIndex} ของ${isTomorrow ? "วันพรุ่งนี้" : "วันนี้"}แล้ว`,
          },
        ],
      });

      return;
    }

    const orders = parseOrders(text);
    // console.log("📋 PARSED ORDERS");
    // console.log(orders);

    if (orders.length === 0) return;

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
              text: `❌ ช่วงเวลาไม่ถูกต้อง: ${order.meal}\nใช้ได้แค่: เช้า / กลางวัน / เย็น`,
            },
          ],
        });

        return; // หรือ break แล้วแต่ behavior ที่ต้องการ
      }

      await addOrder({
        groupId: event.source.groupId,
        customerName: order.customerName,
        meal: order.meal,
        menu: order.menu,
        orderDate: order.orderDate,
      });
    }
  } catch (err) {
    console.error("BOT ERROR:", err);
  }
}
