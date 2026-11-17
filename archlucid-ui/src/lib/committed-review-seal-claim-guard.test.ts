import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd(), "src");

/** Buyer copy must not claim a tenant seal without pairing to sample/demo guards elsewhere. */
const SEAL_CLAIM_PATTERN = /\byour (?:sealed|committed) (?:review|package|record)\b/i;

const ALLOWLIST_SUFFIXES = [
  "lib/first-review-sample-sealed-package-copy.ts",
  "components/usability/OnboardingSampleReviewShortcut.tsx",
  "components/SampleFirstReviewPackageCard.tsx",
] as const;

function walkTsxFiles(dir: string, acc: string[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);

    if (st.isDirectory()) {
      walkTsxFiles(full, acc);

      continue;
    }

    if (!name.endsWith(".tsx")) {
      continue;
    }

    if (name.includes(".test.")) {
      continue;
    }

    acc.push(full);
  }
}

function isAllowlisted(rel: string): boolean {
  return ALLOWLIST_SUFFIXES.some((suffix) => rel.endsWith(suffix));
}

describe("committed review seal claim guard", () => {
  it("does not imply your sealed review in operator components without sample context", () => {
    const componentsDir = join(UI_ROOT, "components");
    const files: string[] = [];

    walkTsxFiles(componentsDir, files);

    const offenders: string[] = [];

    for (const file of files) {
      const rel = relative(UI_ROOT, file).replaceAll("\\", "/");

      if (isAllowlisted(rel)) {
        continue;
      }

      const body = readFileSync(file, "utf8");

      if (SEAL_CLAIM_PATTERN.test(body)) {
        offenders.push(rel);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
