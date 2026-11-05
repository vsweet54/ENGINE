import { sql } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query?.limit ?? "50", 10) || 50, 1), 100);
    const offset = Math.max(Number.parseInt(req.query?.offset ?? "0", 10) || 0, 0);
    const source = typeof req.query?.source === "string" ? req.query.source : null;
    const q = typeof req.query?.q === "string" ? req.query.q.trim().slice(0, 100) : null;

    const rows = await sql`
      SELECT id, source, source_id, name, description, provider, model_type,
             modalities, context_length, downloads, likes, license, tags,
             homepage, inference_eligible, updated_at
      FROM models
      WHERE (${source}::text IS NULL OR source = ${source})
        AND (${q}::text IS NULL OR name ILIKE ${q ? `%${q}%` : null}
             OR description ILIKE ${q ? `%${q}%` : null})
      ORDER BY downloads DESC NULLS LAST, likes DESC NULLS LAST, name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return res.status(200).json({
      data: rows,
      pagination: { limit, offset, returned: rows.length }
    });
  } catch (error) {
    console.error("models_list_failed", error);
    return res.status(500).json({ error: "Unable to load model catalog" });
  }
}
