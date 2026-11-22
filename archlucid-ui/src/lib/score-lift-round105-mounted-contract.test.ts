import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round105 mounted contract", () => {
  it("policy enforced, system health tiles, deliverables export, investigation effort", () => {
    expect(readUiSource("app/(operator)/governance/policy-packs/_sections/PolicyPacksEnforcedRulesTable.tsx")).toContain(
      'data-testid="policy-packs-enforced-rules-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/administration/system-health/_sections/SystemHealthPageView.tsx")).toContain(
      'data-testid="system-health-summary-tiles-point-in-time-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx")).toContain(
      'data-testid="run-detail-deliverables-primary-export-finalize-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx")).toContain(
      'data-testid="securenow-investigation-effort-blocking-not-load-failure"',
    );
  });
});
