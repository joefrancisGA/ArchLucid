import { describe, expect, it } from "vitest";

import { readRegisteredSource } from "@/testing/source-scan-harness";

const createHomeSource = readRegisteredSource("run-detail-page-view-create-home");

describe("RunDetailPageView create-home evidence (TB-1850)", () => {
  it("mounts the deferred create-home evidence panel on the evidence archTab", () => {
    const evidencePanelIndex = createHomeSource.indexOf("evidence: (");
    const evidencePanelSource = createHomeSource.slice(evidencePanelIndex, evidencePanelIndex + 1_200);

    expect(evidencePanelSource).toContain("<RunDetailCreateHomeEvidencePanelDeferred");
    expect(evidencePanelSource).toContain("evidenceCoverageSummaryLine=");
    expect(evidencePanelSource).toContain("evidenceInventoryItems");
    expect(evidencePanelSource).toContain("buyerPolished={m.buyerPolishedArtifactTable");
    expect(evidencePanelSource).not.toContain("<RunDetailCaptureEvidenceSection");
  });
});
