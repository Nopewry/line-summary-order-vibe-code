const orders = new Map();

/**
 * structure:
 * userId -> {
 *   items: [{ name, qty }],
 *   updatedAt: timestamp
 * }
 */

export function getOrder(userId) {
  return orders.get(userId);
}

export function addItem(userId, item) {
  const current = orders.get(userId) || { items: [], updatedAt: Date.now() };

  const existing = current.items.find(i => i.name === item.name);
  if (existing) {
    existing.qty += item.qty;
  } else {
    current.items.push(item);
  }

  current.updatedAt = Date.now();
  orders.set(userId, current);
  return current;
}

export function clearOrder(userId) {
  orders.delete(userId);
}

export function cleanup(expireMs = 1000 * 60 * 30) {
  const now = Date.now();
  for (const [userId, data] of orders.entries()) {
    if (now - data.updatedAt > expireMs) {
      orders.delete(userId);
    }
  }
}