import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const reasonDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  reasonDraftRequest: (...args: unknown[]) => reasonDraftRequest(...args),
}));

import { DraftIntakeReasoningPanel } from "./DraftIntakeReasoningPanel";

describe("DraftIntakeReasoningPanel", () => {
  it("posts a reason turn and renders the assistant answer", async () => {
    reasonDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      conversationThreadId: "thread-1",
      status: "Admitted",
      answer: "Your outcome is measurable; clarify data residency before submit.",
    });

    render(<DraftIntakeReasoningPanel draftId="draft-1" defaultOpen />);

    fireEvent.change(screen.getByTestId("draft-intake-reason-input"), {
      target: { value: "What should I clarify before submit?" },
    });
    fireEvent.click(screen.getByTestId("draft-intake-reason-submit"));

    await waitFor(() => {
      expect(reasonDraftRequest).toHaveBeenCalledWith("draft-1", "What should I clarify before submit?");
    });

    expect(screen.getByText(/data residency/i)).toBeInTheDocument();
  });
});
