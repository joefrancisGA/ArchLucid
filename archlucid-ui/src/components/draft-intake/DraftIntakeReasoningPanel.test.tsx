import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const reasonDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  reasonDraftRequest: (...args: unknown[]) => reasonDraftRequest(...args),
}));

import { DraftIntakeReasoningPanel } from "./DraftIntakeReasoningPanel";

describe("DraftIntakeReasoningPanel", () => {
  it("shows a compact summary when collapsed and no turns exist", () => {
    render(<DraftIntakeReasoningPanel draftId="draft-1" />);

    expect(screen.getByTestId("draft-intake-reasoning-summary")).toHaveTextContent(
      /no suggestions right now/i,
    );
    expect(screen.queryByTestId("draft-intake-reason-input")).not.toBeInTheDocument();
  });

  it("posts a reason turn after expanding follow-up and renders the assistant answer", async () => {
    reasonDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      conversationThreadId: "thread-1",
      status: "Admitted",
      answer: "Your outcome is measurable; clarify data residency before submit.",
    });

    render(<DraftIntakeReasoningPanel draftId="draft-1" defaultOpen />);

    fireEvent.click(screen.getByTestId("draft-intake-reason-follow-up-toggle"));

    fireEvent.change(screen.getByTestId("draft-intake-reason-input"), {
      target: { value: "What should I clarify before submit?" },
    });
    fireEvent.click(screen.getByTestId("draft-intake-reason-submit"));

    await waitFor(() => {
      expect(reasonDraftRequest).toHaveBeenCalledWith("draft-1", "What should I clarify before submit?");
    });

    expect(screen.getByTestId("draft-intake-reasoning-summary")).toHaveTextContent(/data residency/i);
  });

  it("renders embedded mode without an outer collapsible wrapper", () => {
    render(<DraftIntakeReasoningPanel draftId="draft-1" embedded />);

    expect(screen.getByTestId("draft-intake-reasoning-panel").tagName).toBe("DIV");
    expect(screen.getByText("Intake assistant notes")).toBeInTheDocument();
    expect(screen.getByTestId("draft-intake-reason-follow-up-toggle")).toBeInTheDocument();
  });

  it("shows the empty-state copy once in embedded mode", () => {
    render(<DraftIntakeReasoningPanel draftId="draft-1" embedded />);

    expect(screen.getAllByText(/no suggestions right now/i)).toHaveLength(1);
    expect(screen.queryByTestId("draft-intake-reasoning-summary")).not.toBeInTheDocument();
  });
});
