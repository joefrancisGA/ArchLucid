import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterDecisionCard } from "@/app/(operator)/governance/decision-register/DecisionRegisterDecisionCard";
import type { ArchitectureDecisionRegisterEntry } from "@/lib/api/governance-stickiness-api";

function decision(overrides: Partial<ArchitectureDecisionRegisterEntry> = {}): ArchitectureDecisionRegisterEntry {
  return {
    decisionId: "dec-1",
    runId: "11111111-1111-1111-1111-111111111111",
    manifestId: "22222222-2222-2222-2222-222222222222",
    title: "Approve edge gateway posture",
    category: "Security",
    recordedAtUtc: "2026-08-01T12:00:00Z",
    rationale: "",
    confidence: null,
    ...overrides,
  } as ArchitectureDecisionRegisterEntry;
}

describe("DecisionRegisterDecisionCard (P-10)", () => {
  it("labels missing confidence and rationale without Unknown placeholders", () => {
    render(<DecisionRegisterDecisionCard decision={decision()} />);

    expect(screen.getByText("Confidence was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Decision rationale was not stored.")).toBeInTheDocument();
    expect(screen.queryByText(/Unknown/)).not.toBeInTheDocument();
  });
});
