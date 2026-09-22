import { describe, expect, it } from "vitest";

import { formatInfraEvidenceAskTopicKindLabel } from "@/lib/infra-evidence/infra-evidence-ask-topic-kind-label";

describe("formatInfraEvidenceAskTopicKindLabel", () => {
  it("maps known topic kinds to plain labels", () => {
    expect(formatInfraEvidenceAskTopicKindLabel("ResourceOverview")).toBe("Resource overview");
    expect(formatInfraEvidenceAskTopicKindLabel("InventoryChange")).toBe("Inventory change");
    expect(formatInfraEvidenceAskTopicKindLabel("Drift")).toBe("Inventory drift");
  });
});
