import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
