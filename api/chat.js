const MAX_MESSAGES = 30;
const MAX_CONTENT_CHARS = 12000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const base = process.env.INFERENCE_BASE_URL?.replace(/\/+$/, "");
  if (!base) {
    return res.status(503).json({
      error: "Inference is not configured",
      detail: "Catalog APIs work without a user API key. Chat needs a local runtime or an authorized inference provider configured by the operator."
    });
  }

  try {
    const body = req.body ?? {};
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: `messages must contain 1-${MAX_MESSAGES} items` });
    }

    const safeMessages = messages.map((m) => {
      if (!m || !["system", "user", "assistant"].includes(m.role) || typeof m.content !== "string") {
        throw new Error("Invalid message format");
      }
      if (m.content.length > MAX_CONTENT_CHARS) throw new Error("Message is too long");
      return { role: m.role, content: m.content };
    });

    const upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.INFERENCE_API_KEY
          ? { Authorization: `Bearer ${process.env.INFERENCE_API_KEY}` }
          : {})
      },
      body: JSON.stringify({
        model: typeof body.model === "string" && body.model.trim()
          ? body.model.trim()
          : (process.env.INFERENCE_DEFAULT_MODEL || "default"),
        messages: safeMessages,
        stream: Boolean(body.stream)
      })
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    res.status(upstream.status);
    res.setHeader("Content-Type", contentType);
    if (body.stream && upstream.body) {
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      for await (const chunk of upstream.body) res.write(chunk);
      return res.end();
    }
    const text = await upstream.text();
    return res.send(text);
  } catch (error) {
    console.error("chat_gateway_failed", error);
    return res.status(400).json({ error: error.message || "Invalid chat request" });
  }
}
