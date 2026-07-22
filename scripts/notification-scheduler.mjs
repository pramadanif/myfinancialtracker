/**
 * Local notification scheduler — jalankan saat dev/production tanpa crontab eksternal.
 * Usage: node scripts/notification-scheduler.mjs
 * Atau: npm run cron:scheduler
 */

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("CRON_SECRET tidak ditemukan. Pastikan .env sudah diisi.");
  process.exit(1);
}

async function tick() {
  try {
    const res = await fetch(`${BASE_URL}/api/cron/notifications`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    const time = new Date().toLocaleString("id-ID");
    if (res.ok) {
      console.log(`[${time}] OK`, JSON.stringify(data.results));
    } else {
      console.error(`[${time}] Error ${res.status}:`, data);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleString("id-ID")}] Fetch failed:`, err.message);
  }
}

console.log(`Notification scheduler started — checking every hour at ${BASE_URL}`);
tick();
setInterval(tick, 60 * 60 * 1000);
