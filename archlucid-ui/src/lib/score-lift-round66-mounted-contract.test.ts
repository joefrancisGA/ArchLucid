import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round66 mounted contract", () => {
  it("hub tabs, declared connections, compare, impact, signed records, risk, factory simulator", () => {
    expect(
      readUiSource("app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient.tsx"),
    ).toContain("infra-resource-hub-overview-partial-capture");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/declared-connections/DeclaredConnectionsWorkbenchClient.tsx"),
    ).toContain("declared-connections-empty-partial-capture");
    expect(readUiSource("app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel.tsx")).toContain(
      "CompareFindingCorrelationPartialEmptyHonesty",
    );
    expect(readUiSource("app/(operator)/insights/impact-preview/_sections/ImpactPreviewEmptyState.tsx")).toContain(
      "impact-preview-empty-partial-capture",
    );
    expect(readUiSource("app/(operator)/governance/sealed-records/_sections/SignedRecordsListEmptyStates.tsx")).toContain(
      "signed-records-empty-partial-capture",
    );
    expect(readUiSource("components/governance/RiskExceptionsClient.tsx")).toContain("risk-exceptions-empty-partial-capture");
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain(
      "remediation-simulator-partial-capture",
    );
  });
});