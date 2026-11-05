import { fetchJson } from "../http.js";

export async function collectOpenRouter() {
  const payload = await fetchJson("https://openrouter.ai/api/v1/models");
  return (payload.data || []).map((m) => ({
    source: "openrouter",
    source_id: String(m.id),
    name: m.name || m.id,
    description: m.description || null,
    provider: String(m.id).split("/")[0] || "unknown",
    model_type: "chat",
    modalities: m.architecture?.modality ? [m.architecture.modality] : [],
    context_length: Number.isFinite(m.context_length) ? m.context_length : null,
    downloads: null,
    likes: null,
    license: null,
    tags: [],
    homepage: m.id ? `https://openrouter.ai/${m.id}` : null,
    inference_eligible: false
  }));
}
