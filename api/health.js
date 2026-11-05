export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let database = "not_configured";
  if (process.env.DATABASE_URL) {
    try {
      const { sql } = await import("../lib/db.js");
      await sql`select 1`;
      database = "ok";
    } catch {
      database = "error";
    }
  }

  return res.status(database === "error" ? 503 : 200).json({
    ok: database !== "error",
    service: "neo-ai-api",
    database,
    inferenceConfigured: Boolean(process.env.OPENROUTER_API_KEY),
    timestamp: new Date().toISOString()
  });
}
