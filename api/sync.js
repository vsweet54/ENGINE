import { syncCatalog } from "../lib/sync.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const expected = process.env.ADMIN_SECRET;
  const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!expected || supplied !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await syncCatalog();
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("manual_sync_failed", error);
    return res.status(500).json({ error: "Catalog sync failed" });
  }
}
