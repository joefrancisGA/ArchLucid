import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));
const useFinalizeReadinessMock = vi.fn();

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-review-assumption-acknowledgements", () => ({
  useReviewAssumptionAcknowledgements: () => ({ acknowledgedIds: new Set<string>() }),
}));

vi.mock("@/hooks/use-finalize-readiness", () => ({
  useFinalizeReadiness: (...args: unknown[]) => useFinalizeReadinessMock(...args),
}));

vi.mock("@/components/CommitRunButton", () => ({
  CommitRunButton: () => <button type="button">Finalize review</button>,
}));

import { ArchitectureIdentityDeskReviewFinalizeAction } from "@/components/architecture/ArchitectureIdentityDeskReviewFinalizeAction";

describe("ArchitectureIdentityDeskReviewFinalizeAction (SG-022)", () => {
  beforeEach(() => {
    workspaceModeMock.isWorkingMode = true;
    useFinalizeReadinessMock.mockReturnValue({
      readiness: {
        readyToFinalize: true,
        blockedReasonSummary: null,
        blocks: [],
      },
      loading: false,
    });
  });

  it("renders finalize on the desk row when the run is ready", () => {
    render(
      <ArchitectureIdentityDeskReviewFinalizeAction
        runId="run-ready"
        architectureId="arch-001"
        skipWhenInFlight={false}
      />,
    );

    expect(screen.getByRole("button", { name: "Finalize review" })).toBeInTheDocument();
  });

  it("hides finalize while the child job is still in flight", () => {
    render(
      <ArchitectureIdentityDeskReviewFinalizeAction
        runId="run-ready"
        architectureId="arch-001"
        skipWhenInFlight={true}
      />,
    );

    expect(screen.queryByRole("button", { name: "Finalize review" })).toBeNull();
  });
});
