import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPageView.tsx"),
  "utf8",
);

describe("RunDetailPageView create-home evidence (TB-1850)", () => {
  it("mounts the deferred create-home evidence panel on the evidence archTab", () => {
    const evidencePanelIndex = source.indexOf("evidence: (");
    const evidencePanelSource = source.slice(evidencePanelIndex, evidencePanelIndex + 1_200);

    expect(evidencePanelSource).toContain("<RunDetailCreateHomeEvidencePanelDeferred");
    expect(evidencePanelSource).toContain("evidenceCoverageSummaryLine=");
    expect(evidencePanelSource).toContain("evidenceInventoryItems");
    expect(evidencePanelSource).toContain("buyerPolished={m.buyerPolishedArtifactTable");
    expect(evidencePanelSource).not.toContain("<RunDetailCaptureEvidenceSection");
  });
});
