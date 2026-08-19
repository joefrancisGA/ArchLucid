import { describe, expect, it } from "vitest";

import {
  QUICK_DECISION_RECOMMENDATION_FALLBACK,
  buildQuickDecisionFindingEvidenceLinks,
  quickDecisionRecommendationSnippet,
  quickDecisionWorkItemSeverityLabel,
} from "@/lib/quick-decision-finding-links";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

function finding(overrides: Partial<QuickDecisionFinding> = {}): QuickDecisionFinding {
  return {
    findingId: "f-1",
    title: "PHI minimization gap",
    recommendation: "",
    severityValue: 3,
    findingOrder: 0,
    aiReasoning: { findingJson: null, reasoningTrace: null },
    isMuted: false,
    muteReason: null,
    enforcementTier: "Blocking",
    ...overrides,
  } as QuickDecisionFinding;
}

describe("quickDecisionRecommendationSnippet", () => {
  it("returns the first recommendation sentence when present", () => {
    const snippet = quickDecisionRecommendationSnippet(
      finding({ recommendation: "Restrict the storage account. Then re-run the review." }),
    );

    expect(snippet).toBe("Restrict the storage account.");
  });

  it("falls back to shared copy when the finding has no recommendation", () => {
    expect(quickDecisionRecommendationSnippet(finding({ recommendation: "" }))).toBe(
      QUICK_DECISION_RECOMMENDATION_FALLBACK,
    );
  });
});

describe("quickDecisionWorkItemSeverityLabel", () => {
  it("maps the numeric severity scale to work-item wording", () => {
    expect(quickDecisionWorkItemSeverityLabel(4)).toBe("High");
    expect(quickDecisionWorkItemSeverityLabel(3)).toBe("High");
    expect(quickDecisionWorkItemSeverityLabel(2)).toBe("Medium");
    expect(quickDecisionWorkItemSeverityLabel(1)).toBe("Low");
    expect(quickDecisionWorkItemSeverityLabel(0)).toBe("Info");
  });
});

describe("buildQuickDecisionFindingEvidenceLinks", () => {
  it("has no evidence targets when the finding cites nothing and no graph node maps to it", () => {
    const links = buildQuickDecisionFindingEvidenceLinks("run-42", finding({ evidenceRefCount: null }));

    expect(links.evidenceRefCount).toBe(0);
    expect(links.manifestHref).toBeNull();
    expect(links.graphHref).toBeNull();
    expect(links.viewEvidenceHref).toBeNull();
  });

  it("prefers the graph evidence trail when the finding cites evidence refs", () => {
    const links = buildQuickDecisionFindingEvidenceLinks("run-42", finding({ evidenceRefCount: 2 }));

    expect(links.evidenceRefCount).toBe(2);
    expect(links.manifestHref).toBeNull();
    expect(links.graphHref).not.toBeNull();
    expect(links.viewEvidenceHref).toBe(links.graphHref);
  });

  it("prefers the signed-record manifest section for the showcase finding", () => {
    const links = buildQuickDecisionFindingEvidenceLinks(
      SHOWCASE_STATIC_DEMO_RUN_ID,
      finding({ findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID, evidenceRefCount: 3 }),
    );

    expect(links.manifestHref).not.toBeNull();
    expect(links.viewEvidenceHref).toBe(links.manifestHref);
  });
});
