import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPacksPickReviewBeforeAssigningStrip } from "./PolicyPacksPickReviewBeforeAssigningStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-pack-1", runId: "run-pack-1" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("PolicyPacksPickReviewBeforeAssigningStrip", () => {
  it("renders pick review strip", () => {
    render(
      <PolicyPacksPickReviewBeforeAssigningStrip selectedReviewId="" onSelectReview={vi.fn()} />,
    );

    expect(screen.getByTestId("policy-packs-pick-review-before-assigning-strip")).toBeInTheDocument();
    expect(screen.getByText("Pick a review before assigning")).toBeInTheDocument();
  });
});
