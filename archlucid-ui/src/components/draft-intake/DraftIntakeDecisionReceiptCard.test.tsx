import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DraftIntakeDecisionReceiptCard } from "./DraftIntakeDecisionReceiptCard";

describe("DraftIntakeDecisionReceiptCard", () => {
  it("renders redirect summary and links to server decision receipt export", () => {
    render(
      <DraftIntakeDecisionReceiptCard
        draftId="draft-1"
        redirectReason="I need at least one kind of user."
        verdict={{
          kind: "SoftInfeasible",
          summary: "Actor set is required.",
          transparencyTrail: {
            asserted: [],
            inferred: [{ key: "policy.violation.rto", value: "RTO exceeds stated ceiling", confidence: 0.9 }],
            skipped: [{ questionKey: "l0.must.actor", tier: "Must" }],
          },
        }}
        freeTextIntent="Build a workflow."
        businessOutcome="Faster triage."
        systemName=""
      />,
    );

    expect(screen.getByTestId("draft-intake-decision-receipt-card")).toBeInTheDocument();
    expect(screen.getByText(/actor set is required/i)).toBeInTheDocument();
    expect(screen.getByTestId("feasibility-verdict-drivers")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /download decision receipt/i })).toHaveAttribute(
      "data-testid",
      "decision-receipt-export",
    );
  });
});
