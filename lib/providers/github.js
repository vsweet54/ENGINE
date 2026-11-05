import { fetchJson } from "../http.js";

export async function collectGitHub() {
  const url = "https://api.github.com/search/repositories?q=llm+in:name,description,readme&sort=stars&order=desc&per_page=50";
  const repos = await fetchJson(url, {
    headers: { Accept: "application/vnd.github+json" }
  });
  return (repos.items || []).map((r) => ({
    source: "github",
    source_id: `${r.full_name}`,
    name: r.full_name,
    description: r.description || null,
    provider: r.owner?.login || "community",
    model_type: "repository",
    modalities: [],
    context_length: null,
    downloads: null,
    likes: Number.isFinite(r.stargazers_count) ? r.stargazers_count : null,
    license: r.license?.spdx_id || null,
    tags: Array.isArray(r.topics) ? r.topics.slice(0, 30) : [],
    homepage: r.html_url,
    inference_eligible: false
  }));
}
