import { getToday } from "./date.js";

export function generateSummary(orders, targetDate) {
  const today = getToday();

  const thaiDate = targetDate
    .split("-")
    .reverse()
    .join("/");

  const title =
    targetDate === today
      ? "วันนี้"
      : "วันพรุ่งนี้";

  const meals = ["เช้า", "กลางวัน", "เย็น"];

  let text =
  `📦 ออเดอร์ของ${title} (${thaiDate})\n`;

  for (const meal of meals) {
    text += `*********************\n🍽 ${meal}\n`;

    const mealOrders = orders.filter(
      o =>
        o.meal === meal
    );

    text += "🍚 เมนูนะจว๊ะ\n";

    for (const item of mealOrders) {
      text += `• ${item.menu} - ${item.customer_name}\n`;
    }

    text += "\n";
  }

  return text;
}