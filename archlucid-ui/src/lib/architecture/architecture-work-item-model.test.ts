import { describe, expect, it } from "vitest";

import {
  buildArchitectureWorkItemClipboardBody,
  buildArchitectureWorkItemPreview,
  clipboardFormatForItsmProvider,
  pickNativeCreateFindingId,
} from "@/lib/architecture/architecture-work-item-model";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

function finding(partial: Partial<QuickDecisionFinding> & Pick<QuickDecisionFinding, "findingId">): QuickDecisionFinding {
  return {
    title: "Encrypt data at rest",
    recommendation: "Enable storage encryption.",
    severityValue: 3,
    findingOrder: 0,
    aiReasoning: { wireJson: "{}", reasoningTrace: "" },
    isMuted: false,
    muteReason: null,
    enforcementTier: "blocking",
    ...partial,
  };
}

describe("architecture-work-item-model", () => {
  it("builds a shared preview with architecture link and findings", () => {
    const preview = buildArchitectureWorkItemPreview({
      runId: "run-1",
      architectureName: "Payments platform",
      architectureOverview: "Event-driven payments with card tokenization.",
      ownerLabel: "Platform team",
      findings: [finding({ findingId: "f-1" })],
      siteOrigin: "https://app.archlucid.test",
    });

    expect(preview.title).toContain("Payments platform");
    expect(preview.owner).toBe("Platform team");
    expect(preview.findingsIncluded).toHaveLength(1);
    expect(preview.sourceArchitectureLink).toBe("https://app.archlucid.test/architecture/reviews/run-1");
    expect(pickNativeCreateFindingId([finding({ findingId: "f-1", severityValue: 2 }), finding({ findingId: "f-2", severityValue: 4 })])).toBe("f-2");
  });

  it("uses provider-specific clipboard formats after selection", () => {
    const preview = buildArchitectureWorkItemPreview({
      runId: "run-1",
      architectureName: "Payments platform",
      architectureOverview: "Overview",
      ownerLabel: null,
      findings: [],
      siteOrigin: "https://app.archlucid.test",
    });

    const jiraBody = buildArchitectureWorkItemClipboardBody(clipboardFormatForItsmProvider("Jira"), preview);
    const serviceNowBody = buildArchitectureWorkItemClipboardBody(clipboardFormatForItsmProvider("ServiceNow"), preview);

    expect(jiraBody).toContain("h2.");
    expect(serviceNowBody).toContain("Short description:");
    expect(jiraBody).toContain(preview.sourceArchitectureLink);
    expect(serviceNowBody).toContain(preview.sourceArchitectureLink);
  });
});
