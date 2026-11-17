import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round65 mounted contract", () => {
  it("ask drawer, explorer, policy detail, attack path, sponsor drift, diagrams, terraform", () => {
    expect(readUiSource("components/infra-evidence/InfrastructureAskDrawerHost.tsx")).toContain(
      "infrastructure-ask-drawer-partial-capture-recovery",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.tsx")).toContain(
      "infra-resource-explorer-empty-partial-capture",
    );
    expect(readUiSource("app/(operator)/governance/policy-packs/[id]/PolicyPackGenericDetail.tsx")).toContain(
      "PolicyPackDetailPartialCaptureStrip",
    );
    expect(
      readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx"),
    ).toContain("attack-path-report-unevaluated-only-partial");
    expect(readUiSource("components/SponsorWorkspaceHealthKpiBlocks.tsx")).toContain("sponsor-drift-partial-window");
    expect(readUiSource("app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient.tsx")).toContain(
      "infra-diagrams-partial-capture",
    );
    expect(readUiSource("app/(operator)/governance/infrastructure/terraform/TerraformWorkbenchClient.tsx")).toContain(
      "infra-terraform-partial-capture",
    );
  });
});