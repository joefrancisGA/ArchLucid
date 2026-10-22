import { readFileSync } from "node:fs";
import { join } from "node:path";

const AUTH_EXCLUDED_RELATIVE_PATHS = [
  "lib/oidc/bff-session-sync.ts",
  "lib/proxy/bff-session-request.ts",
  "lib/proxy/bff-session-csrf-client.ts",
  "lib/proxy/bff-session-idle.ts",
  "lib/proxy/bff-session-cookie.ts",
] as const;

const FORBIDDEN_MARKERS = [
  "executeIdempotentLivelihoodMutation",
  "withLivelihood401Resume",
  "writeLivelihoodPendingMutation",
  "LIVELIHOOD_PENDING_MUTATION_STORAGE_KEY",
] as const;

export type LostWrite401ResumeAuthExclusionViolation = {
  readonly relativePath: string;
  readonly message: string;
};

export function findLostWrite401ResumeAuthExclusionViolations(uiRoot: string): LostWrite401ResumeAuthExclusionViolation[] {
  const violations: LostWrite401ResumeAuthExclusionViolation[] = [];

  for (const relativePath of AUTH_EXCLUDED_RELATIVE_PATHS) {
    const absolutePath = join(uiRoot, "src", relativePath);
    let source = "";

    try {
      source = readFileSync(absolutePath, "utf8");
    } catch {
      violations.push({
        relativePath,
        message: "Auth/BFF session module missing on disk for 401 resume exclusion ratchet.",
      });
      continue;
    }

    for (const marker of FORBIDDEN_MARKERS) {
      if (source.includes(marker)) {
        violations.push({
          relativePath,
          message: `Auth/BFF session module must not reference livelihood 401 resume (${marker}).`,
        });
      }
    }
  }

  return violations;
}
