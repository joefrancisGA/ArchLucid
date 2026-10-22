import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FindingDidNotThinkOfThatButton } from "./FindingDidNotThinkOfThatButton";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working", mounted: true }),
}));

const getFindingInsightSignalStatus = vi.fn();
const postFindingInsightSignal = vi.fn();

vi.mock("@/lib/api/finding-insight-signal-api", () => ({
  getFindingInsightSignalStatus: (...args: unknown[]) => getFindingInsightSignalStatus(...args),
  postFindingInsightSignal: (...args: unknown[]) => postFindingInsightSignal(...args),
}));

describe("FindingDidNotThinkOfThatButton", () => {
  beforeEach(() => {
    getFindingInsightSignalStatus.mockReset();
    postFindingInsightSignal.mockReset();
    getFindingInsightSignalStatus.mockResolvedValue({ kinds: [] });
    postFindingInsightSignal.mockResolvedValue(undefined);
  });

  it("posts DidNotThinkOfThat and shows status tag after success", async () => {
    render(<FindingDidNotThinkOfThatButton runId="run-1" findingId="finding-1" />);

    await waitFor(() => {
      expect(getFindingInsightSignalStatus).toHaveBeenCalledWith("run-1", "finding-1");
    });

    fireEvent.click(screen.getByRole("button", { name: /mark finding finding-1 as not thought of/i }));

    await waitFor(() => {
      expect(postFindingInsightSignal).toHaveBeenCalledWith("run-1", "finding-1", "DidNotThinkOfThat");
    });

    expect(screen.getByText("Not thought of")).toBeInTheDocument();
  });

  it("shows status tag when signal already recorded", async () => {
    getFindingInsightSignalStatus.mockResolvedValue({ kinds: ["DidNotThinkOfThat"] });

    render(<FindingDidNotThinkOfThatButton runId="run-1" findingId="finding-2" />);

    await waitFor(() => {
      expect(screen.getByText("Not thought of")).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /not thought of/i })).not.toBeInTheDocument();
  });
});
