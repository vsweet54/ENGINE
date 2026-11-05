
import { sql } from "../lib/db.js";

const MAX_MESSAGES = 30;
const MAX_CONTENT_CHARS = 12000;
const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "Chat is not configured"
    });
  }

  try {
    const body = req.body ?? {};
    const requestedModel =
      typeof body.model === "string" ? body.model.trim() : "";

    if (!requestedModel || requestedModel.length > 200) {
      return res.status(400).json({
        error: "A valid model is required."
      });
    }

    const modelId = requestedModel.startsWith("openrouter:")
      ? requestedModel.slice("openrouter:".length)
      : requestedModel;

    // Izinkan router model gratis OpenRouter.
    const isFreeRouter = modelId === "free";

    // Model lainnya wajib berasal dari katalog OpenRouter.
    if (!isFreeRouter) {
      const rows = await sql`
        SELECT id FROM models
        WHERE source = 'openrouter'
          AND source_id = ${modelId}
        LIMIT 1
      `;

      if (!rows.length) {
        return res.status(400).json({
          error: "Model is not available in the OpenRouter catalog."
        });
      }
    }

    const messages = body.messages;

    if (
      !Array.isArray(messages) ||
      messages.length < 1 ||
      messages.length > MAX_MESSAGES
    ) {
      return res.status(400).json({
        error: `messages must contain 1-${MAX_MESSAGES} items`
      });
    }

    const safeMessages = messages.map((m) => {
  if (
    !m ||
    !["system", "user", "assistant"].includes(m.role) ||
    typeof m.content !== "string"
  ) {
    throw new Error("Invalid message format");
  }

  return {
    role: m.role,
    content: m.content
  };
});

safeMessages.unshift({
  role: "system",
  content: "Kamu adalah NEO AI. Jawab menggunakan bahasa yang sama dengan pengguna. Jika pengguna menggunakan bahasa Indonesia, gunakan bahasa Indonesia yang natural, jelas, dan mudah dipahami."
});

      if (m.content.length > MAX_CONTENT_CHARS) {
        throw new Error("Message is too long");
      }

      return {
        role: m.role,
        content: m.content
      };
    });

    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_SITE_URL ||
          "https://neoengine.vercel.app",
        "X-Title": "NEO AI"
      },
      body: JSON.stringify({
        model: isFreeRouter ? "openrouter/free" : modelId,
        messages: safeMessages,
        stream: Boolean(body.stream)
      })
    });

    res.status(upstream.status);

    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") ||
        "application/json"
    );

    if (body.stream && upstream.body) {
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of upstream.body) {
        res.write(chunk);
      }

      return res.end();
    }

    return res.send(await upstream.text());

  } catch (error) {
    console.error("chat_gateway_failed", error);

    return res.status(400).json({
      error: error.message || "Invalid chat request"
    });
  }
}
