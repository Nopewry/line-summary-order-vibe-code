export function parseMessage(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const items = [];

  for (const line of lines) {
    const match = line.match(/(.+?)\s+(\d+)$/);
    if (!match) continue;

    items.push({
      name: match[1].trim(),
      qty: Number(match[2])
    });
  }

  return items;
}