import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round74 mounted contract", () => {
  it("status filter, attack path report, simulator, and cut-point chips", () => {
    expect(readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx")).toContain(
      "RemediationWorkbenchStatusFilterEmptyPartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain(
      "attack-path-report-load-failure-partial-capture",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain(
      "attack-path-report-diagram-filter-empty-partial-capture",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "RemediationFactorySimulatorLoadFailurePartialHonesty",
    );
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryTopCutPointsSection.tsx")).toContain(
      "formatAttackPathReportPathChipLabel",
    );
  });
});