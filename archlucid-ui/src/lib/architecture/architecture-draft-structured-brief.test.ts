import { describe, expect, it } from "vitest";

import {
  applyIncomingStructuredBriefSuggestions,
  emptyArchitectureDraftStructuredBrief,
  joinQualityAttributeEntries,
  parseQualityAttributeEntries,
  qualityAttributeMeetsMinimum,
} from "@/lib/architecture/architecture-draft-structured-brief";

describe("applyIncomingStructuredBriefSuggestions", () => {
  it("merges new suggestions and skips confirmed duplicates", () => {
    const current = {
      ...emptyArchitectureDraftStructuredBrief(),
      confirmedConstraints: ["EU data residency"],
      suggestedAssumptions: ["Single-region pilot"],
    };

    const applied = applyIncomingStructuredBriefSuggestions(current, {
      suggestedConstraints: ["EU data residency", "Private networking only"],
      suggestedAssumptions: ["Single-region pilot", "Existing integrations remain"],
      suggestedCapabilities: ["Audit logging"],
    });

    expect(applied.addedSuggestionCount).toBe(3);
    expect(applied.brief.suggestedConstraints).toEqual(["Private networking only"]);
    expect(applied.brief.suggestedAssumptions).toEqual(["Single-region pilot", "Existing integrations remain"]);
    expect(applied.brief.suggestedRequiredCapabilities).toEqual(["Audit logging"]);
  });

  it("returns zero when every incoming item is already covered", () => {
    const current = {
      ...emptyArchitectureDraftStructuredBrief(),
      confirmedConstraints: ["EU data residency"],
      confirmedAssumptions: ["Single-region pilot"],
    };

    const applied = applyIncomingStructuredBriefSuggestions(current, {
      suggestedConstraints: ["EU data residency"],
      suggestedAssumptions: ["Single-region pilot"],
      suggestedCapabilities: [],
    });

    expect(applied.addedSuggestionCount).toBe(0);
    expect(applied.brief.suggestedConstraints).toEqual([]);
    expect(applied.brief.suggestedAssumptions).toEqual([]);
  });
});

describe("quality attribute chips", () => {
  it("round-trips semicolon-delimited entries", () => {
    const entries = ["RTO 4h", "p95 latency 200ms"];

    expect(parseQualityAttributeEntries(joinQualityAttributeEntries(entries))).toEqual(entries);
  });

  it("requires at least one numeric entry across chips", () => {
    expect(qualityAttributeMeetsMinimum("RTO 4h; cost cap unknown")).toBe(true);
    expect(qualityAttributeMeetsMinimum("high availability; low latency")).toBe(false);
  });
});
