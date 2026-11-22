import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round104 mounted contract", () => {
  it("connection dashboard, run findings header, graph filter, attack path table", () => {
    expect(readUiSource("components/integrations/ConnectorOperationsDashboard.tsx")).toContain(
      "ConnectionStatusDashboardPartialCaptureHonesty",
    );
    expect(readUiSource("app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx")).toContain(
      "RunDetailFindingsHeaderPartialCaptureHonesty",
    );
    expect(readUiSource("app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx")).toContain(
      'data-testid="evidence-graph-type-filter-empty-not-load-failure"',
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain(
      'data-testid="attack-path-report-table-partial-capture-not-load-failure"',
    );
  });
});
