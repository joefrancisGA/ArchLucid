import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const DETAIL_CLIENT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "insights",
  "patterns",
  "_sections",
  "PatternLibraryDetailClient.tsx",
);

describe("pattern-library-detail-cta-guard (TB-1815)", () => {
  it("resolves provenance through the shared hook instead of hard-coded false", () => {
    const source = readFileSync(DETAIL_CLIENT, "utf8");

    expect(source).toContain("usePatternLibraryProvenance");
    expect(source).not.toMatch(/resolvePatternLibraryProvenance\s*\(\s*false\s*\)/);
    expect(source).not.toMatch(/usingLiveAggregate\s*:\s*false/);
    expect(source).not.toMatch(/badgeLabel:\s*["']Sample data["']/);
  });

  it("keeps one primary Use in review CTA cluster and demotes footer duplicate", () => {
    const source = readFileSync(DETAIL_CLIENT, "utf8");

    expect(source).toContain('data-testid="pattern-library-detail-primary-use-in-review"');
    expect(source).toContain('data-testid="pattern-library-detail-secondary-use-in-review"');
    expect(source).toContain('data-testid="pattern-library-detail-primary-cta-cluster"');
    expect(source).not.toContain("<Card");
    expect(source).toContain('id="architecture-shape"');
    expect(source).toContain('id="next-steps"');
  });
});
