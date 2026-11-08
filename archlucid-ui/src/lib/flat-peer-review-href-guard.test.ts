import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/** Catches accidental reintroduction of inline peer-only `` `/architecture/reviews/${…}` `` in high-traffic Operate scopes. */
const FLAT_REVIEW_HREF_SUBSTRING = "href={`/architecture/reviews/${";

const GUARDED_RELATIVE_DIRS = [
  "src/components/alerts",
  "src/components/advisory",
  "src/components/digests",
  "src/components/governance",
  "src/components/insights",
] as const;

const GUARDED_COMPONENT_FILES = [
  "src/components/GraphViewerNodeDetailPanel.tsx",
  "src/components/ManifestTopDecisionsCard.tsx",
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

describe("flat peer review href guard (Operate scopes)", () => {
  it("does not use template literal peer /architecture/reviews/${ in guarded Operate scopes", () => {
    const uiRoot = process.cwd();
    const offenders: string[] = [];

    for (const rel of GUARDED_RELATIVE_DIRS) {
      const dir = join(uiRoot, rel);
      const files: string[] = [];

      walkTsxFiles(dir, files);

      for (const file of files) {
        const body = readFileSync(file, "utf8");

        if (body.includes(FLAT_REVIEW_HREF_SUBSTRING)) {
          offenders.push(file);
        }
      }
    }

    for (const rel of GUARDED_COMPONENT_FILES) {
      const file = join(uiRoot, rel);
      const body = readFileSync(file, "utf8");

      if (body.includes(FLAT_REVIEW_HREF_SUBSTRING)) {
        offenders.push(file);
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
