import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));

describe("finding inspect request consolidation", () => {
  it("shares one cached slim inspect between metadata and finding detail page loader", () => {
    const cached = readFileSync(join(here, "load-finding-inspect-for-route-cached.ts"), "utf8");
    const metadata = readFileSync(join(here, "findings/finding-route-metadata.ts"), "utf8");
    const pageLoader = readFileSync(
      join(
        here,
        "../app/(operator)/architecture/reviews/[runId]/findings/[findingId]/_sections/load-finding-detail-page-model.ts",
      ),
      "utf8",
    );

    expect(cached).toContain('import { cache } from "react"');
    expect(cached).toContain("loadFindingInspectForRouteCached");
    expect(metadata).toContain("loadFindingInspectForRouteCached");
    expect(metadata).toContain("false");
    expect(pageLoader).toContain("loadFindingInspectForRouteCached");
    expect(pageLoader).not.toMatch(/loadFindingInspectForRoute\(/);
  });
});
