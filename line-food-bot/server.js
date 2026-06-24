const express = require("express");
const fs = require("fs/promises");
const cron = require("node-cron");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const ORDERS_FILE = "./orders.json";

// ===================
// Helper
// ===================

async function readOrders() {
  try {
    const data = await fs.readFile(ORDERS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveOrders(orders) {
  await fs.writeFile(
    ORDERS_FILE,
    JSON.stringify(orders, null, 2)
  );
}

function buildSummary(orders) {
  const meals = ["เช้า", "กลางวัน", "เย็น"];

  let text = `Order ของวันพรุ่งนี้\n\n`;

  for (const meal of meals) {
    const rice = orders.filter(
      (o) => o.meal === meal && o.type === "ข้าว"
    );

    const side = orders.filter(
      (o) => o.meal === meal && o.type === "กับ"
    );

    text += `========== ${meal} ==========\n\n`;

    text += "พร้อมข้าว\n";

    if (rice.length === 0) {
      text += "- ไม่มีรายการ\n";
    } else {
      rice.forEach((order) => {
        text += `• ${order.menu} - ${order.name}\n`;
      });
    }

    text += "\n";

    text += "กับข้าว\n";

    if (side.length === 0) {
      text += "- ไม่มีรายการ\n";
    } else {
      side.forEach((order) => {
        text += `• ${order.menu} - ${order.name}\n`;
      });
    }

    text += "\n\n";
  }

  return text;
}

// ===================
// Health Check
// ===================

app.get("/", (req, res) => {
  res.send("OK");
});

app.get("/webhook", (req, res) => {
  res.send("WEBHOOK READY");
});

// ===================
// LINE Webhook
// ===================

app.post("/webhook", async (req, res) => {
  console.log("========== LINE WEBHOOK ==========");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

// ===================
// Create Order
// ===================

app.post("/order", async (req, res) => {
  try {
    const { meal, name, menu, type } = req.body;

    if (!meal || !name || !menu || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const orders = await readOrders();

    orders.push({
      meal,
      name,
      menu,
      type,
      createdAt: new Date().toISOString(),
    });

    await saveOrders(orders);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
    });
  }
});

// ===================
// Summary
// ===================

app.get("/summary", async (req, res) => {
  const orders = await readOrders();

  const summary = buildSummary(orders);

  res.send(summary);
});

// ===================
// Clear Orders
// ===================

app.delete("/orders", async (req, res) => {
  await saveOrders([]);

  res.json({
    success: true,
  });
});

// ===================
// Cron
// ===================

cron.schedule("0 23 * * *", async () => {
  const orders = await readOrders();

  const summary = buildSummary(orders);

  console.log("\n");
  console.log("===== DAILY SUMMARY =====");
  console.log(summary);

  await saveOrders([]);

  console.log("Orders cleared.");
});

// ===================
// Start Server
// ===================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});