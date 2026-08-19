import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/** Canonical copy for the pre-first-refresh operator freshness state (TB-2111). */
const CANONICAL_SOURCE = "src/lib/operator/operator-last-refreshed-label.ts";

const REMEDIATION =
  "Import OPERATOR_NOT_REFRESHED_LABEL or operatorFreshnessMetadata* from operator-last-refreshed-label.ts instead of inlining freshness copy.";

function collectProductionSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectProductionSourceFiles(fullPath));

      continue;
    }

    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe("TB-2111 operator last-refreshed consolidation contract", () => {
  it("keeps the bare Not refreshed yet label only in the canonical helper module", () => {
    const offenders: string[] = [];

    for (const filePath of collectProductionSourceFiles(SRC_ROOT)) {
      const relativePath = relative(process.cwd(), filePath).replaceAll("\\", "/");

      if (relativePath === CANONICAL_SOURCE) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");

      if (source.includes("Not refreshed yet")) {
        offenders.push(relativePath);
      }
    }

    expect(offenders, REMEDIATION).toEqual([]);
  });
});
