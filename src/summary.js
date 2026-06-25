export function generateSummary(orders) {
  const meals = ["เช้า", "กลางวัน", "เย็น"];

  let text =
    `📦 Order ของวันพรุ่งนี้\n\n`;

  for (const meal of meals) {
    text += `*********************\n🍽 ${meal}\n*********************\n\n`;

    const orders = orders.filter(
      o =>
        o.meal === meal
    );

    text += "🍚 เมนูนะจว๊ะ\n";

    for (const item of orders) {
      text += `• ${item.menu} - ${item.customer_name}\n`;
    }

    text += "\n";
  }

  return text;
}