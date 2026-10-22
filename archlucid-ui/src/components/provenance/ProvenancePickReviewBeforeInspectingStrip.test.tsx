import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProvenancePickReviewBeforeInspectingStrip } from "./ProvenancePickReviewBeforeInspectingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-prov-1", displayTitle: "Claims review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string; onChange: (value: string) => void }) => (
    <button type="button" data-testid="ask-run-id-picker" onClick={() => props.onChange("run-picked-1")}>
      {props.value}
    </button>
  ),
}));

describe("ProvenancePickReviewBeforeInspectingStrip", () => {
  it("renders review picker guidance", () => {
    render(<ProvenancePickReviewBeforeInspectingStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("provenance-pick-review-before-inspecting-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before inspecting provenance/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-prov-1");
  });

  it("forwards a picked review", () => {
    const onSelectReview = vi.fn();
    render(<ProvenancePickReviewBeforeInspectingStrip selectedReviewId="" onSelectReview={onSelectReview} />);

    fireEvent.click(screen.getByTestId("ask-run-id-picker"));

    expect(onSelectReview).toHaveBeenCalledWith("run-picked-1");
  });
});
