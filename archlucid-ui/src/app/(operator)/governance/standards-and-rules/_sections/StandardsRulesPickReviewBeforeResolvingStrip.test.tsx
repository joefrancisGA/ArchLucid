import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StandardsRulesPickReviewBeforeResolvingStrip } from "./StandardsRulesPickReviewBeforeResolvingStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-gov-1", displayTitle: "Claims review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("StandardsRulesPickReviewBeforeResolvingStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <StandardsRulesPickReviewBeforeResolvingStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("standards-rules-pick-review-before-resolving-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before resolving/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-gov-1");
  });
});
