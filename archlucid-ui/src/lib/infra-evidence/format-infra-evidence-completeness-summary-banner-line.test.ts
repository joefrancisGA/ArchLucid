import { describe, expect, it } from "vitest";

import { formatInfraEvidenceCompletenessSummaryBannerLine } from "@/lib/infra-evidence/format-infra-evidence-completeness-summary-banner-line";
import type { InfraEvidenceMermaidCompletenessSummary } from "@/lib/infra-evidence/infra-evidence-mermaid-types";

function summary(
  partial: Partial<InfraEvidenceMermaidCompletenessSummary>,
): InfraEvidenceMermaidCompletenessSummary {
  return {
    mode: partial.mode ?? "network",
    visibleNodeCount: partial.visibleNodeCount ?? 10,
    visibleEdgeCount: partial.visibleEdgeCount ?? 4,
    connectedComponentCount: partial.connectedComponentCount ?? 3,
    hiddenHopsUsedCount:
      partial.hiddenHopsUsedCount === undefined ? 0 : partial.hiddenHopsUsedCount,
    likelyInCollocationEdgeCount:
      partial.likelyInCollocationEdgeCount === undefined ? 0 : partial.likelyInCollocationEdgeCount,
    collectedClasses: partial.collectedClasses ?? [],
    missingClasses: partial.missingClasses ?? [],
  };
}

describe("formatInfraEvidenceCompletenessSummaryBannerLine", () => {
  it("appends missing classes when present", () => {
    const line = formatInfraEvidenceCompletenessSummaryBannerLine(
      summary({ missingClasses: ["Missing NIC subnet ids."] }),
    );

    expect(line).toContain("10 resources in 3 connected components.");
    expect(line).toContain("Missing: Missing NIC subnet ids.");
  });

  it("includes hidden hop count when greater than zero", () => {
    const line = formatInfraEvidenceCompletenessSummaryBannerLine(
      summary({ hiddenHopsUsedCount: 2 }),
    );

    expect(line).toContain("(2 from hidden attachment hops)");
  });

  it("labels null hidden-hop and collocation counts as not stored (P-19)", () => {
    const line = formatInfraEvidenceCompletenessSummaryBannerLine(
      summary({ hiddenHopsUsedCount: null, likelyInCollocationEdgeCount: null }),
    );

    expect(line).toContain("Hidden attachment hop count was not stored.");
    expect(line).toContain("Likely-in collocation count was not stored.");
  });
});
