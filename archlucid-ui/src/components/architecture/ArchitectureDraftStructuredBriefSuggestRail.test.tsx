import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftStructuredBriefSuggestRail } from "@/components/architecture/ArchitectureDraftStructuredBriefSuggestRail";
import type { StructuredBriefSuggestionsState } from "@/components/architecture/use-structured-brief-suggestions";

function buildSuggestions(overrides: Partial<StructuredBriefSuggestionsState> = {}): StructuredBriefSuggestionsState {
  return {
    overviewTrimmedLength: 120,
    failureModeSourceText: "source",
    canSuggestFromOverview: true,
    canSuggestFailureMode: false,
    suggestBusy: false,
    suggestStageLabel: null,
    suggestEmpty: false,
    suggestAddedCount: null,
    suggestError: null,
    evidenceContradictedAssumptions: {},
    setEvidenceContradictedAssumptions: vi.fn(),
    onSuggestFromOverview: vi.fn(),
    onSuggestFailureMode: vi.fn(),
    failureModeSuggestBusy: false,
    failureModeSuggestEmpty: false,
    failureModeSuggestApplied: false,
    failureModeSuggestError: null,
    ...overrides,
  };
}

describe("ArchitectureDraftStructuredBriefSuggestRail", () => {
  it("renders suggest-from-overview control", () => {
    render(<ArchitectureDraftStructuredBriefSuggestRail suggestions={buildSuggestions()} />);
    expect(screen.getByTestId("architecture-draft-suggest-structured-brief")).toHaveTextContent("Suggest from overview");
  });
});
