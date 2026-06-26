import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

console.log(
  "SHEET ID =",
  process.env.SPREADSHEET_ID
);

const serviceAccount = JSON.parse(
  process.env.GOOGLE_SERVICE_ACCOUNT
);

const auth = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const doc = new GoogleSpreadsheet(
  process.env.SPREADSHEET_ID,
  auth
);

export async function addOrder(order) {
  console.log("ADD ORDER =", order);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  await sheet.addRow({
    timestamp: new Date().toISOString(),
    group_id: order.groupId,
    customer_name: order.customerName,
    meal: order.meal,
    menu: order.menu,
  });
}

export async function getRows() {
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  return await sheet.getRows();
}

export async function getOrders() {
  const rows = await getRows();

  return rows.map(row => ({
    row,
    group_id: row.get("group_id"),
    customer_name: row.get("customer_name"),
    meal: row.get("meal"),
    menu: row.get("menu"),
    timestamp: row.get("timestamp"),
  }));
}