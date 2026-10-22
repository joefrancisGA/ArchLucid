import { describe, expect, it } from "vitest";

import { resolveContinueLastDecisionRegisterEntry } from "@/lib/resolve-continue-last-decision-register-entry";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

function decision(overrides: Partial<ArchitectureDecisionRegisterEntry> = {}): ArchitectureDecisionRegisterEntry {
  return {
    decisionId: "decision-1",
    manifestId: "manifest-1",
    runId: "run-1",
    category: "Security",
    title: "Approve private endpoints",
    selectedOption: "Accept",
    rationale: "rationale",
    recordedAtUtc: "2026-01-01T00:00:00Z",
    supportingFindingIds: [],
    ...overrides,
  };
}

describe("resolveContinueLastDecisionRegisterEntry", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastDecisionRegisterEntry(null)).toBeNull();
    expect(resolveContinueLastDecisionRegisterEntry({})).toBeNull();
    expect(resolveContinueLastDecisionRegisterEntry("nope")).toBeNull();
    expect(resolveContinueLastDecisionRegisterEntry([])).toBeNull();
  });

  it("prefers the most recently recorded decision when no recent view exists", () => {
    const match = resolveContinueLastDecisionRegisterEntry([
      decision({ decisionId: "decision-old", recordedAtUtc: "2025-01-01T00:00:00Z" }),
      decision({ decisionId: "decision-new", recordedAtUtc: "2026-02-01T00:00:00Z" }),
    ]);

    expect(match?.decisionId).toBe("decision-new");
  });
});
