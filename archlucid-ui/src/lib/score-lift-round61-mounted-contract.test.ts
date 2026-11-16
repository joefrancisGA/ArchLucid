import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round61 mounted contract", () => {
  it("workspace health, findings empty, extract upload, and workbench partial strips", () => {
    expect(
      readUiSource("app/(operator)/insights/workspace-health/_sections/WorkspaceHealthPageView.tsx"),
    ).toContain("SecureNowWorkspaceHealthPartialCaptureStrip");
    expect(readUiSource("app/(operator)/governance/findings/_sections/GovernanceFindingsQueueOutcomeSection.tsx")).toContain(
      "governance-findings-empty-partial-capture",
    );
    expect(
      readUiSource("app/(operator)/administration/extract-upload/_sections/ExtractUploadAcceptedPackagePanel.tsx"),
    ).toContain("ExtractUploadPartialCaptureStrip");
    expect(
      readUiSource("app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx"),
    ).toContain("SecureNowRemediationWorkbenchPartialCaptureStrip");
  });

  it("collection second capture, attack path rerank, and Ask drawer partial honesty", () => {
    expect(readUiSource("components/product-line/SecureNowCollectionSetupStatusSection.tsx")).toContain(
      "collection-second-capture-remaining",
    );
    expect(
      readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx"),
    ).toContain("REMEDIATION_FACTORY_ATTACK_PATH_PARTIAL_RERANK_LINE");
    expect(readUiSource("components/infra-evidence/InfrastructureAskDrawerHost.tsx")).toContain(
      "infrastructure-ask-drawer-partial-capture",
    );
  });
});