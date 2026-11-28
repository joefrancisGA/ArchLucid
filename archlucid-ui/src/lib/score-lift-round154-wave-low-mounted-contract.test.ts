import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round154 wave low-score mounted contract", () => {
  it("mounts H3 cutting-edge, template richness, reader posture, sealed review path, and assigned empty stickiness", () => {
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx")).toContain("remediation-ranked-paths-cutting-edge-substrate");
    expect(readUiSource("components/security/SecurityEvidencePathInspectPanel.tsx")).toContain("path-inspect-cutting-edge-substrate");
    expect(readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx")).toContain("attack-path-cutting-edge-substrate");
    expect(readUiSource("app/(operator)/administration/securenow-accelerator-index/SecureNowAcceleratorIndexPageView.tsx")).toContain("securenow-accelerator-template-richness-honesty");
    expect(readUiSource("app/(operator)/administration/securenow-scenario-walks/SecureNowScenarioWalksPageView.tsx")).toContain("securenow-scenario-walks-template-richness-honesty");
    expect(readUiSource("app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsPageShell.tsx")).toContain("cloud-connections-reader-inventory-posture");
    expect(readUiSource("app/(operator)/architecture/reviews/_sections/RunsPageView.tsx")).toContain("reviews-hub-sealed-review-buyer-path");
    const assigned = readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx");
    expect(assigned).toContain("governance-assigned-to-me-empty-time-to-value-next-step");
    expect(assigned).toContain("governance-assigned-to-me-empty-adoption-friction-next-step");
    expect(assigned).toContain("governance-assigned-to-me-empty-stickiness-not-sla");
  });
});
