import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  applyIncomingStructuredBriefSuggestions,
  emptyArchitectureDraftStructuredBrief,
  joinQualityAttributeEntries,
  mergeExclusiveConfirmedItem,
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

  it("requires at least one confirmed entry across chips", () => {
    expect(qualityAttributeMeetsMinimum("RTO 4h; cost cap unknown")).toBe(true);
    expect(qualityAttributeMeetsMinimum("high availability; low latency")).toBe(true);
    expect(qualityAttributeMeetsMinimum("")).toBe(false);
  });
});

describe("mergeExclusiveConfirmedItem", () => {
  const unknown = ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL;
  const statedFact = "EU data residency";

  it("ignores blank values and does not re-add a legacy unknown sentinel", () => {
    expect(mergeExclusiveConfirmedItem([statedFact], "   ")).toEqual([statedFact]);
    expect(mergeExclusiveConfirmedItem([statedFact], unknown)).toEqual([statedFact]);
    expect(mergeExclusiveConfirmedItem([], unknown)).toEqual([]);
    expect(mergeExclusiveConfirmedItem([unknown], unknown)).toEqual([unknown]);
  });

  it("strips an existing unknown sentinel when a stated fact is added", () => {
    expect(mergeExclusiveConfirmedItem([unknown], statedFact)).toEqual([statedFact]);
    expect(mergeExclusiveConfirmedItem([unknown, statedFact], "Private networking")).toEqual([
      statedFact,
      "Private networking",
    ]);
  });

  it("merges stated facts uniquely", () => {
    expect(mergeExclusiveConfirmedItem([statedFact], statedFact)).toEqual([statedFact]);
    expect(mergeExclusiveConfirmedItem([statedFact], "Private networking")).toEqual([
      statedFact,
      "Private networking",
    ]);
  });
});
