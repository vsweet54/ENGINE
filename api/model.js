import { sql } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const id = typeof req.query?.id === "string" ? req.query.id : "";
  if (!id) return res.status(400).json({ error: "Query parameter id is required" });

  try {
    const rows = await sql`
      SELECT id, source, source_id, name, description, provider, model_type,
             modalities, context_length, downloads, likes, license, tags,
             homepage, inference_eligible, updated_at
      FROM models WHERE id = ${id} LIMIT 1
    `;
    if (!rows.length) return res.status(404).json({ error: "Model not found" });
    return res.status(200).json({ data: rows[0] });
  } catch (error) {
    console.error("model_detail_failed", error);
    return res.status(500).json({ error: "Unable to load model" });
  }
}
