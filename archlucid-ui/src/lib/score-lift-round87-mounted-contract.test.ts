import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}
describe("score-lift round87 mounted contract", () => {
  it("compare pickers, quality delta, digest subscriptions, findings scope only", () => {
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareRunPickersSection.tsx")).toContain('data-testid="compare-run-pickers-first-selected-second-empty"');
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareQualityDeltaPanel.tsx")).toContain('data-testid="compare-quality-delta-zero-counts-one-unsealed"');
    expect(readUiSource("components/digests/DigestsBrowseContent.tsx")).toContain('data-testid="digests-browse-subscription-list-only-empty"');
    const findings = readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueResultsSection.tsx");
    expect(findings).toContain('data-testid={');
    expect(findings).toContain('"governance-findings-architecture-scope-only-filter-empty"');
    expect(findings).toContain('"governance-findings-assigned-to-me-architecture-scope-only-filter-empty"');
  });
});