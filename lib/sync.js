import { sql } from "./db.js";
import { collectOpenRouter } from "./providers/openrouter.js";
import { collectHuggingFace } from "./providers/huggingface.js";
import { collectGitHub } from "./providers/github.js";

const collectors = [
  ["openrouter", collectOpenRouter],
  ["huggingface", collectHuggingFace],
  ["github", collectGitHub]
];

export async function syncCatalog() {
  const report = [];
  for (const [source, collect] of collectors) {
    try {
      const models = await collect();
      let saved = 0;
      for (const m of models) {
        await sql`
          INSERT INTO models (
            id, source, source_id, name, description, provider, model_type,
            modalities, context_length, downloads, likes, license, tags,
            homepage, inference_eligible, updated_at
          ) VALUES (
            ${`${m.source}:${m.source_id}`}, ${m.source}, ${m.source_id},
            ${m.name}, ${m.description}, ${m.provider}, ${m.model_type},
            ${m.modalities}, ${m.context_length}, ${m.downloads}, ${m.likes},
            ${m.license}, ${m.tags}, ${m.homepage}, ${m.inference_eligible}, NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            provider = EXCLUDED.provider,
            model_type = EXCLUDED.model_type,
            modalities = EXCLUDED.modalities,
            context_length = EXCLUDED.context_length,
            downloads = EXCLUDED.downloads,
            likes = EXCLUDED.likes,
            license = EXCLUDED.license,
            tags = EXCLUDED.tags,
            homepage = EXCLUDED.homepage,
            inference_eligible = EXCLUDED.inference_eligible,
            updated_at = NOW()
        `;
        saved++;
      }
      report.push({ source, fetched: models.length, saved, ok: true });
    } catch (error) {
      console.error(`source_sync_failed:${source}`, error);
      report.push({ source, ok: false, error: error.message });
    }
  }

  return {
    sources: report,
    totalSaved: report.reduce((sum, r) => sum + (r.saved || 0), 0),
    completedAt: new Date().toISOString()
  };
}
