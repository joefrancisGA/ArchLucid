import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findMisleadingTrustCenterHelpLabels } from "@/lib/data-handling-help-copy-guard";

const LIB_ROOT = join(process.cwd(), "src", "lib");

function collectHelpCopyFiles(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectHelpCopyFiles(fullPath));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts") || entry.name.endsWith(".test.ts")) {
      continue;
    }

    if (!entry.name.includes("help") || !entry.name.includes("copy") || entry.name.includes("copy-guard")) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

describe("data-handling-help-copy-guard", () => {
  it("forbids contracted/tenant artifact labels that resolve to /trust", () => {
    const violations: string[] = [];

    for (const absolutePath of collectHelpCopyFiles(LIB_ROOT)) {
      const source = readFileSync(absolutePath, "utf8");
      const labels = findMisleadingTrustCenterHelpLabels(source);

      for (const label of labels) {
        violations.push(`${absolutePath}: ${label}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
