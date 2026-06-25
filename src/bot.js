import db from "./db.js";
import { parseOrders } from "./parser.js";

export async function handleEvent(event) {
  console.log("🤖 handleEvent called");
  console.log("TEXT =", event.message?.text);
  try {
    if (event.type !== "message") return;

    if (event.message.type !== "text") return;

    if (event.source.type !== "group") return;

    const text = event.message.text;

    const orders = parseOrders(text);
    console.log("📋 PARSED ORDERS");
    console.log(orders);

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

    const rows = db
    .prepare("SELECT * FROM orders")
    .all();

    console.log("📦 ROWS IN DB");
    console.log(rows);

    console.log("✅ DB INSERT SUCCESS");
  } catch (err) {
    console.error("BOT ERROR:", err);
  }
}