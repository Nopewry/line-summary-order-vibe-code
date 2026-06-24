import db from "./db.js";
import { parseOrders } from "./parser.js";

export async function handleEvent(event) {
  if (event.type !== "message") return;

  if (event.message.type !== "text") return;

  if (event.source.type !== "group") return;

  const text = event.message.text;

  const orders = parseOrders(text);

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

  for (const order of orders) {
    insertStmt.run(
      event.source.groupId,
      order.customerName,
      order.meal,
      order.orderType,
      order.menu
    );
  }
}