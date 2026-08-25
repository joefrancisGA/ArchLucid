import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditPickReviewBeforeSearchStrip } from "./AuditPickReviewBeforeSearchStrip";

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => ({ runId: "run-audit-1", displayTitle: "Claims review" }),
}));

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

describe("AuditPickReviewBeforeSearchStrip", () => {
  it("renders review picker guidance", () => {
    render(<AuditPickReviewBeforeSearchStrip selectedReviewId="" onSelectReview={() => undefined} />);

    expect(screen.getByTestId("audit-pick-review-before-search-strip")).toBeInTheDocument();
    expect(screen.getByText(/Pick a review before searching the audit trail/)).toBeInTheDocument();
  });
});
