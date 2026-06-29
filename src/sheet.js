import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { getDateBefore } from "./date.js";

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

function getDoc(groupId) {
  const spreadsheetId =
    groupId === process.env.GROUP_ID_TEST
      ? process.env.SPREADSHEET_ID_TEST
      : process.env.SPREADSHEET_ID_MAIN;

  return new GoogleSpreadsheet(
    spreadsheetId,
    auth
  );
}

export async function addOrder(groupId, order) {
  console.log("ADD ORDER =", order);
  const doc = getDoc(groupId);

  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  await sheet.addRow({
    timestamp: new Date().toISOString(),
    group_id: order.groupId,
    customer_name: order.customerName,
    meal: order.meal,
    menu: order.menu,
    order_date: order.orderDate,
  });
}

export async function getRows() {
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  return await sheet.getRows();
}

export async function getOrders(groupId) {

  const doc = getDoc(groupId);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  return rows.map(row => ({
    row,
    group_id: row.get("group_id"),
    customer_name: row.get("customer_name"),
    meal: row.get("meal"),
    menu: row.get("menu"),
    order_date: row.get("order_date"),
    timestamp: row.get("timestamp"),
  }));
}

export async function deleteOldOrders(groupId) {
  const doc = getDoc(groupId);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];

  const rows = await sheet.getRows();

  const cutoff = getDateBefore(7);

  for (const row of rows) {
    if (row.get("order_date") < cutoff) {
      await row.delete();
    }
  }
}