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