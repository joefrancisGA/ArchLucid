import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const triggerDecisionReceiptDownload = vi.fn();

vi.mock("@/lib/decision-receipt-export", async () => {
  const actual = await vi.importActual<typeof import("@/lib/decision-receipt-export")>(
    "@/lib/decision-receipt-export",
  );

  return {
    ...actual,
    triggerDecisionReceiptDownload: (...args: unknown[]) => triggerDecisionReceiptDownload(...args),
  };
});

import { DraftIntakeDecisionReceiptCard } from "./DraftIntakeDecisionReceiptCard";

describe("DraftIntakeDecisionReceiptCard", () => {
  it("renders redirect summary and downloads a decision receipt", () => {
    render(
      <DraftIntakeDecisionReceiptCard
        draftId="draft-1"
        redirectReason="I need at least one kind of user."
        verdict={{ kind: "SoftInfeasible", summary: "Actor set is required." }}
        freeTextIntent="Build a workflow."
        businessOutcome="Faster triage."
        systemName=""
      />,
    );

    expect(screen.getByTestId("draft-intake-decision-receipt-card")).toBeInTheDocument();
    expect(screen.getByText(/actor set is required/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("decision-receipt-export"));

    expect(triggerDecisionReceiptDownload).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "draft-admission",
        draftId: "draft-1",
      }),
    );
  });
});
