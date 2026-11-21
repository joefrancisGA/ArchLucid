import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round102 mounted contract", () => {
  it("guided toolbar, presenter, diagram reconcile stale, home open gate", () => {
    const findings = readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx");
    const presenter = readUiSource("components/reviews/ReviewDetailWorkspace.tsx");
    const diagram = readUiSource("app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient.tsx");
    const home = readUiSource("app/(operator)/_sections/OperatorHomePageView.tsx");
    const homeStrip = readUiSource("components/operator-home/OperatorHomeSecureNowCollectionBlockerStrip.tsx");

    expect(findings).toContain('data-testid="guided-review-findings-toolbar-filter-empty-not-load-failure"');
    expect(presenter).toContain('data-testid="review-presenter-mode-empty-not-load-failure"');
    expect(diagram).toContain('data-testid="infra-diagram-reconcile-stale-snapshot-filter-empty-not-load-failure"');
    expect(home).toContain("OperatorHomeSecureNowCollectionBlockerStrip");
    expect(homeStrip).toContain('data-testid="operator-home-open-gate-collection-blocker-not-load-failure"');
  });
});
