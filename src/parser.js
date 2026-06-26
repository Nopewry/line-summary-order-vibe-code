export function parseOrders(text) {
  const lines = text
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  const orders = [];

  for (const line of lines) {
    const parts = line.split("/").map(x => x.trim());

    let customerName;
    let meal;
    let menu;

    const orderDate = new Date();

    if (parts.length === 3) {
      customerName = parts[0];
      meal = parts[1];
      menu = parts[2];
    }

    else if (
      parts.length === 4 &&
      parts[0] === "พน."
    ) {
      orderDate.setDate(
        orderDate.getDate() + 1
      );

      customerName = parts[1];
      meal = parts[2];
      menu = parts[3];
    }

    else {
      continue;
    }

    orders.push({
      customerName,
      meal,
      menu,
      orderDate:
        orderDate
          .toISOString()
          .slice(0, 10)
    });
  }

  return orders;
}