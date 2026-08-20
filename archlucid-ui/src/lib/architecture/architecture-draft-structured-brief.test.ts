import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
  applyIncomingStructuredBriefSuggestions,
  areConfirmedFactControlsDisabled,
  confirmedFactControlsDisabledReason,
  emptyArchitectureDraftStructuredBrief,
  isMarkUnknownControlDisabled,
  joinQualityAttributeEntries,
  markUnknownDisabledReason,
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

describe("exclusive unknown vs stated facts", () => {
  it("disables Mark unknown when stated facts or the unknown sentinel are present", () => {
    expect(isMarkUnknownControlDisabled([], false)).toBe(false);
    expect(isMarkUnknownControlDisabled(["Private endpoints required"], false)).toBe(true);
    expect(isMarkUnknownControlDisabled([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL], false)).toBe(true);
    expect(isMarkUnknownControlDisabled([], true)).toBe(true);
  });

  it("disables add and confirm only while unknown is selected", () => {
    expect(areConfirmedFactControlsDisabled([], false, true)).toBe(false);
    expect(areConfirmedFactControlsDisabled(["Private endpoints required"], false, true)).toBe(false);
    expect(areConfirmedFactControlsDisabled([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL], false, true)).toBe(true);
    expect(areConfirmedFactControlsDisabled([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL], false, false)).toBe(false);
    expect(areConfirmedFactControlsDisabled([], true, true)).toBe(true);
  });

  it("explains why exclusive controls are disabled", () => {
    expect(markUnknownDisabledReason([])).toBeUndefined();
    expect(markUnknownDisabledReason(["Private endpoints required"])).toBe(
      "Remove selected items before marking this field unknown.",
    );
    expect(markUnknownDisabledReason([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL])).toBe(
      "This field is already marked unknown.",
    );
    expect(confirmedFactControlsDisabledReason([], true)).toBeUndefined();
    expect(confirmedFactControlsDisabledReason([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL], false)).toBeUndefined();
    expect(confirmedFactControlsDisabledReason([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL], true)).toBe(
      "Remove the unknown marker before adding or confirming items.",
    );
  });

  it("keeps unknown and stated facts from coexisting", () => {
    expect(mergeExclusiveConfirmedItem([], " ")).toEqual([]);
    expect(mergeExclusiveConfirmedItem(["Private endpoints required"], ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)).toEqual(
      ["Private endpoints required"],
    );
    expect(mergeExclusiveConfirmedItem([ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL], "Private endpoints required")).toEqual(
      ["Private endpoints required"],
    );
    expect(mergeExclusiveConfirmedItem([], ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL)).toEqual([
      ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL,
    ]);
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
