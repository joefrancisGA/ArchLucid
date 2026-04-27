import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const PRIVACY_POLICY_RAW_GITHUB_URL =
  "https://raw.githubusercontent.com/joefrancisGA/ArchLucid/main/docs/go-to-market/PRIVACY_POLICY.md";

export const PRIVACY_POLICY_BLOB_GITHUB_URL =
  "https://github.com/joefrancisGA/ArchLucid/blob/main/docs/go-to-market/PRIVACY_POLICY.md";

const LAST_REVIEWED_PATTERN = /<!--\s*PRIVACY_POLICY_LAST_REVIEWED_UTC:([^>]+)\s*-->/;

/**
 * Reads `docs/go-to-market/PRIVACY_POLICY.md` from the monorepo root, or
 * `go-to-market-samples/PRIVACY_POLICY.md` inside the Docker UI build.
 */
export function readPrivacyPolicyMarkdown(): string {
  const cwd = process.cwd();
  const dockerPath = join(cwd, "go-to-market-samples", "PRIVACY_POLICY.md");

  if (existsSync(dockerPath))
    return readFileSync(dockerPath, "utf8").replace(/\r\n/g, "\n");

  const monorepoPath = join(cwd, "..", "docs", "go-to-market", "PRIVACY_POLICY.md");

  if (existsSync(monorepoPath))
    return readFileSync(monorepoPath, "utf8").replace(/\r\n/g, "\n");

  throw new Error(
    "PRIVACY_POLICY.md not found. Expected ../docs/go-to-market/PRIVACY_POLICY.md (monorepo) or go-to-market-samples/PRIVACY_POLICY.md (Docker).",
  );
}

export function parsePrivacyPolicyLastReviewedUtc(markdown: string): string | null {
  const m = markdown.match(LAST_REVIEWED_PATTERN);
  return m ? m[1]!.trim() : null;
}
