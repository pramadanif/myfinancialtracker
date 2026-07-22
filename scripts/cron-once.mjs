/**
 * Single-shot cron runner — dipanggil oleh cron VPS atau npm run cron:notifications
 */

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("CRON_SECRET tidak ditemukan di .env");
  process.exit(1);
}

const res = await fetch(`${BASE_URL}/api/cron/notifications`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${CRON_SECRET}`,
    "Content-Type": "application/json",
  },
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  console.error(`Error ${res.status}: server returned non-JSON response`);
  console.error(text.slice(0, 200));
  process.exit(1);
}

if (!res.ok) {
  console.error(`Error ${res.status}:`, data);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
console.log(`[${new Date().toISOString()}] Cron notifications OK`);
