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
    expect(screen.getByText("Locked with sealed review record")).toBeInTheDocument();
    expect(screen.queryByText(/^Signed$/)).not.toBeInTheDocument();
  });

  it("maps buyer confidence source through explainability labels (P-15)", () => {
    render(
      <DecisionRegisterDecisionCard
        decision={decision({
          confidence: 0.82,
          buyerConfidenceSource: "Evidence-backed",
        })}
      />,
    );

    expect(screen.getByText(/82% \(recorded as a 0–1 fraction\)/)).toBeInTheDocument();
    expect(screen.getByText(/\(Evidence-backed\)/)).toBeInTheDocument();
  });

  it("labels missing category and empty supporting findings", () => {
    render(
      <DecisionRegisterDecisionCard
        decision={decision({ category: "", supportingFindingIds: [] })}
      />,
    );

    expect(screen.getByText("Decision category was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Supporting findings were stored empty.")).toBeInTheDocument();
  });
});
