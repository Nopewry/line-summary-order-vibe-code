const express = require("express");
const fs = require("fs/promises");
const cron = require("node-cron");
const line = require("@line/bot-sdk");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const ORDERS_FILE = "./orders.json";

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// ===================
// Helpers
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
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function adminAuth(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (key !== process.env.ADMIN_KEY) {
    return res.sendStatus(401);
  }

  next();
}

function buildSummary(orders) {
  const meals = ["เช้า", "กลางวัน", "เย็น"];

  let text = `Order ของวันพรุ่งนี้\n\n`;

  for (const meal of meals) {
    const rice = orders.filter((o) => o.meal === meal && o.type === "ข้าว");

    const side = orders.filter((o) => o.meal === meal && o.type === "กับ");

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

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;

    const validMeals = ["เช้า", "กลางวัน", "เย็น"];

    const validTypes = ["ข้าว", "กับ"];

    for (const event of events) {
      if (event.type !== "message") continue;
      if (event.message.type !== "text") continue;

      const text = event.message.text.trim();

      const parts = text.split("|").map((x) => x.trim());

      // format:
      // เช้า|กะเพราหมู|ข้าว

      if (parts.length !== 3) continue;

      const [meal, menu, type] = parts;

      if (!validMeals.includes(meal) || !validTypes.includes(type)) {
        continue;
      }

      const userId = event.source.userId;

      const groupId = event.source.groupId;

      let name = "Unknown";

      try {
        const profile = await client.getGroupMemberProfile(groupId, userId);

        name = profile.displayName;
      } catch (err) {
        console.log("cannot get profile");
      }

      const orders = await readOrders();

      orders.push({
        meal,
        menu,
        type,
        name,
        userId,
        groupId,
        createdAt: new Date().toISOString(),
      });

      await saveOrders(orders);

      console.log(`saved: ${name} ${menu}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// ===================
// Debug Routes
// ===================

app.get("/orders", adminAuth, async (req, res) => {
  const orders = await readOrders();

  res.json(orders);
});

app.get("/summary", adminAuth, async (req, res) => {
  const orders = await readOrders();

  res.send(buildSummary(orders));
});

app.delete("/orders", adminAuth, async (req, res) => {
  await saveOrders([]);

  res.json({
    success: true,
  });
});

// ===================
// Daily Summary
// ===================

cron.schedule("0 23 * * *", async () => {
  try {
    const orders = await readOrders();

    if (!orders || orders.length === 0) {
      console.log("No orders today");
      return;
    }

    const summary = buildSummary(orders);

    const groupId = orders[0].groupId;

    await client.pushMessage(groupId, {
      type: "text",
      text: summary,
    });

    await saveOrders([]);

    console.log("Summary sent");
  } catch (err) {
    console.error(err);
  }
});

// ===================
// Error Handler
// ===================

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

console.log("SECRET:", process.env.LINE_CHANNEL_SECRET);

console.log("TOKEN:", process.env.LINE_CHANNEL_ACCESS_TOKEN);

// ===================
// Start
// ===================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
