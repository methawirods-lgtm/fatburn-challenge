const BIN_ID = process.env.JSONBIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const ADMIN_PW = process.env.ADMIN_PASSWORD || "Fatburn2026";
const BASE_URL = "https://api.jsonbin.io/v3/b";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function readDB() {
  const res = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
    headers: { "X-Master-Key": API_KEY, "X-Bin-Meta": "false" },
  });
  if (!res.ok) throw new Error(`DB read failed: ${res.status}`);
  const data = await res.json();
  return data.participants ? data : { participants: [] };
}

async function writeDB(db) {
  const res = await fetch(`${BASE_URL}/${BIN_ID}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Master-Key": API_KEY },
    body: JSON.stringify(db),
  });
  if (!res.ok) throw new Error(`DB write failed: ${res.status}`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "DELETE") return { statusCode: 405, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const body = JSON.parse(event.body || "{}");
    if (body.adminPassword !== ADMIN_PW)
      return { statusCode: 401, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Unauthorized" }) };

    const db = await readDB();
    db.participants = db.participants.filter((p) => p.id !== body.key);
    await writeDB(db);

    return { statusCode: 200, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: err.message }) };
  }
};
