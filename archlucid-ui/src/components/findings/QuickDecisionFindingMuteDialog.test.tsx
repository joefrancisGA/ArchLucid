import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
  usePathname: () => "/architecture/reviews/run-1",
}));

const postFindingMuteMock = vi.fn();

vi.mock("@/lib/api", () => ({
  postFindingMute: (runId: string, findingId: string, reason: string) =>
    postFindingMuteMock(runId, findingId, reason),
}));

import { QuickDecisionFindingMuteDialog } from "@/components/findings/QuickDecisionFindingMuteDialog";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

const finding = {
  findingId: "f-1",
  title: "PHI minimization gap",
  recommendation: "Restrict the storage account.",
  severityValue: 3,
  findingOrder: 0,
  aiReasoning: { findingJson: null, reasoningTrace: null },
  isMuted: false,
  muteReason: null,
  enforcementTier: "Blocking",
} as QuickDecisionFinding;

function renderDialog(onOpenChange = vi.fn()) {
  render(
    <QuickDecisionFindingMuteDialog
      runId="run-1"
      finding={finding}
      open
      onOpenChange={onOpenChange}
      reasonInputId="finding-mute-reason"
    />,
  );

  return onOpenChange;
}

describe("QuickDecisionFindingMuteDialog", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    postFindingMuteMock.mockReset();
    postFindingMuteMock.mockResolvedValue(undefined);
  });

  it("requires a reason before the mute can be submitted", () => {
    renderDialog();

    const submit = screen.getByRole("button", { name: "Mute finding" });

    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "  " } });

    expect(submit).toBeDisabled();
  });

  it("posts the trimmed reason, closes, and refreshes the route", async () => {
    const onOpenChange = renderDialog();

    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "  accepted risk  " } });
    fireEvent.click(screen.getByRole("button", { name: "Mute finding" }));

    await waitFor(() => {
      expect(postFindingMuteMock).toHaveBeenCalledWith("run-1", "f-1", "accepted risk");
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open and surfaces the failure when the mute request fails", async () => {
    postFindingMuteMock.mockRejectedValue(new Error("Mute rejected by policy"));

    const onOpenChange = renderDialog();

    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "accepted risk" } });
    fireEvent.click(screen.getByRole("button", { name: "Mute finding" }));

    expect(await screen.findByText("Mute rejected by policy")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("clears state through the caller when Cancel is pressed", () => {
    const onOpenChange = renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
