import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdvisoryScansPickReviewBeforeScanningStrip } from "./AdvisoryScansPickReviewBeforeScanningStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ activeRunId: "run-scan-1", setActiveRunId: () => undefined }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("AdvisoryScansPickReviewBeforeScanningStrip", () => {
  it("renders review picker guidance", () => {
    render(
      <AdvisoryScansPickReviewBeforeScanningStrip selectedReviewId="" onSelectReview={() => undefined} />,
    );

    expect(screen.getByTestId("advisory-scans-pick-review-before-scanning-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before scanning/)).toBeInTheDocument();
    expect(screen.getByTestId("ask-run-id-picker")).toHaveTextContent("run-scan-1");
  });
});
