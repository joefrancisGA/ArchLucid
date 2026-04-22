import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Loads the canonical synthetic bulletin Markdown from the repo (local dev + CI).
 * Docker standalone copies the same file under `go-to-market-samples/` at build time.
 */
export function loadSampleAggregateRoiBulletinSyntheticMarkdown(): string {
  const cwd = process.cwd();

  const dockerBuildPath = join(cwd, "go-to-market-samples", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");
  const monorepoDevPath = join(cwd, "..", "docs", "go-to-market", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");

  if (existsSync(dockerBuildPath)) {
    return readFileSync(dockerBuildPath, "utf8");
  }

  if (existsSync(monorepoDevPath)) {
    return readFileSync(monorepoDevPath, "utf8");
  }

  throw new Error(
    "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md not found. Expected go-to-market-samples/ (Docker) or ../docs/go-to-market/ (local).",
  );
}
