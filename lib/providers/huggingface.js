import { fetchJson } from "../http.js";

export async function collectHuggingFace() {
  const url = "https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=100";
  const models = await fetchJson(url);
  return models.map((m) => ({
    source: "huggingface",
    source_id: String(m.modelId || m.id),
    name: String(m.modelId || m.id),
    description: null,
    provider: String(m.modelId || m.id).split("/")[0] || "community",
    model_type: "weights",
    modalities: ["text"],
    context_length: null,
    downloads: Number.isFinite(m.downloads) ? m.downloads : null,
    likes: Number.isFinite(m.likes) ? m.likes : null,
    license: m.cardData?.license || null,
    tags: Array.isArray(m.tags) ? m.tags.slice(0, 30) : [],
    homepage: `https://huggingface.co/${encodeURIComponent(String(m.modelId || m.id))}`,
    inference_eligible: false
  }));
}
