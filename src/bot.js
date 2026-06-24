import { addItem, getOrder, clearOrder } from "./orderStore.js";
import { parseMessage } from "./parser.js";

export async function handleEvent(event, client) {
  if (event.type !== "message") return;

  const userId = event.source.userId;
  const text = event.message.text.trim();

  // reset command
  if (text === "/reset") {
    clearOrder(userId);
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "ล้างออเดอร์แล้ว"
    });
  }

  // summary command
  if (text === "/summary") {
    const order = getOrder(userId);

    if (!order || order.items.length === 0) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "ยังไม่มีออเดอร์"
      });
    }

    const summary = order.items
      .map(i => `• ${i.name} x${i.qty}`)
      .join("\n");

    return client.replyMessage(event.replyToken, {
      type: "text",
      text: `📦 สรุปออเดอร์\n\n${summary}`
    });
  }

  // normal order input
  const items = parseMessage(text);

  if (items.length === 0) {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "ส่งออเดอร์เป็นรูปแบบ: ชื่ออาหาร จำนวน เช่น\nข้าวกะเพรา 2"
    });
  }

  items.forEach(item => addItem(userId, item));

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: "เพิ่มออเดอร์แล้ว ✅ (พิมพ์ /summary เพื่อดูสรุป)"
  });
}