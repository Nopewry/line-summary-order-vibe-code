export function parseOrders(text) {
  const lines = text
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);

  const orders = [];

  for (const line of lines) {
    const parts = line.split("/").map(x => x.trim());

    if (parts.length !== 3) continue;

    orders.push({
      customerName: parts[0],
      meal: parts[1],
      menu: parts[2]
    });
  }

  return orders;
}