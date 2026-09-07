import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureDraftRoomHeaderButton } from "@/components/architecture/ArchitectureDraftRoomHeaderButton";
import type { RunSummary } from "@/types/authority";

const pushMock = vi.fn();
const useRunSummaryQueryMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/hooks/use-run-summary-query", () => ({
  useRunSummaryQuery: (...args: unknown[]) => useRunSummaryQueryMock(...args),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

function completeRunSummary(): RunSummary {
  return {
    runId: "run-42",
    projectId: "proj-1",
    createdUtc: "2026-09-01T00:00:00Z",
    goldenManifestId: "manifest-v1",
    legacyRunStatus: "Completed",
    completedUtc: "2026-09-01T01:00:00Z",
  };
}

describe("ArchitectureDraftRoomHeaderButton (DR-16)", () => {
  beforeEach(() => {
    pushMock.mockReset();
    useRunSummaryQueryMock.mockReturnValue({ data: completeRunSummary() });
  });

  it("navigates to linked review room elicitation when Room is clicked", () => {
    render(<ArchitectureDraftRoomHeaderButton linkedReviewId="run-42" />);

    fireEvent.click(screen.getByTestId("review-room-enter"));

    expect(pushMock).toHaveBeenCalledWith("/architecture/reviews/run-42?roomElicitation=1");
  });

  it("hides when linked review pipeline is incomplete", () => {
    useRunSummaryQueryMock.mockReturnValue({
      data: {
        ...completeRunSummary(),
        goldenManifestId: null,
        legacyRunStatus: "Running",
        completedUtc: null,
      },
    });

    render(<ArchitectureDraftRoomHeaderButton linkedReviewId="run-42" />);

    expect(screen.queryByTestId("review-room-enter")).not.toBeInTheDocument();
  });

  it("hides when no linked review exists", () => {
    render(<ArchitectureDraftRoomHeaderButton linkedReviewId={null} />);

    expect(screen.queryByTestId("review-room-enter")).not.toBeInTheDocument();
  });
});
