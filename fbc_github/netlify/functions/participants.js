// Uses JSONBin.io as a free database - no npm packages needed
// JSONBin stores a single JSON document we treat as our whole DB

const BIN_ID = process.env.JSONBIN_ID;
const API_KEY = process.env.JSONBIN_API_KEY;
const BASE_URL = "https://api.jsonbin.io/v3/b";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function readDB() {
  const res = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
    headers: {
      "X-Master-Key": API_KEY,
      "X-Bin-Meta": "false",
    },
  });
  if (!res.ok) throw new Error(`DB read failed: ${res.status}`);
  const data = await res.json();
  // data is the raw record — should be { participants: [...] }
  return data.participants ? data : { participants: [] };
}

async function writeDB(db) {
  const res = await fetch(`${BASE_URL}/${BIN_ID}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
    },
    body: JSON.stringify(db),
  });
  if (!res.ok) throw new Error(`DB write failed: ${res.status}`);
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (!BIN_ID || !API_KEY) {
    return {
      statusCode: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Missing JSONBIN_ID or JSONBIN_API_KEY environment variables" }),
    };
  }

  // ── GET ──────────────────────────────────────────────────────────────────
  if (event.httpMethod === "GET") {
    try {
      const db = await readDB();
      return {
        statusCode: 200,
        headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ participants: db.participants, updatedAt: Date.now() }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { name, height, age, weight, fat, photo } = body;

      if (!name?.trim())
        return { statusCode: 400, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Name is required" }) };
      if (!weight || weight < 30 || weight > 300)
        return { statusCode: 400, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid weight" }) };
      if (!fat || fat < 3 || fat > 70)
        return { statusCode: 400, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid body fat %" }) };

      const db = await readDB();
      const key = name.trim().toLowerCase().replace(/\s+/g, "-");
      let participant = db.participants.find((p) => p.id === key);

      if (!participant) {
        participant = {
          id: key,
          name: name.trim(),
          height: height || null,
          age: age || null,
          colorIdx: db.participants.length,
          entries: [],
        };
        db.participants.push(participant);
      } else {
        if (height) participant.height = height;
        if (age) participant.age = age;
      }

      const bmi = height ? parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1)) : null;
      const d1fat = participant.entries.length > 0 ? participant.entries[0].fat : fat;
      // Percent Fat Change = (New - Old) / Old * 100
      // Negative = fat lost (good), Positive = fat gained (bad)
      const score = parseFloat((((fat - d1fat) / d1fat) * 100).toFixed(4));

      participant.entries.push({
        date: new Date().toISOString(),
        weight,
        fat,
        bmi,
        score,
        // Skip photo in DB to keep bin size small — photos stay client-side only
        photo: null,
      });

      await writeDB(db);

      return {
        statusCode: 200,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, participant }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
