import Database from "better-sqlite3";

const dbPath = "data/orders.db";

console.log("DB PATH =", dbPath);
console.log("CWD =", process.cwd());

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  meal TEXT NOT NULL,
  order_type TEXT NOT NULL,
  menu TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

export default db;