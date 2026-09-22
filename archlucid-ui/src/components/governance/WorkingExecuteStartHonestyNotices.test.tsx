import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WorkingExecuteStartHonestyNotices } from "@/components/governance/WorkingExecuteStartHonestyNotices";
import { WorkspaceModeContext } from "@/components/WorkspaceModeProvider";
import { WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE } from "@/lib/governance/working-record-simulator-start-honesty";

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => ({
      mode: "working" as const,
      mounted: true,
      accountSyncState: "synced" as const,
      isWorkingMode: true,
      setAndPersist: vi.fn(),
    }),
  };
});

vi.mock("@/hooks/use-working-career-rehearsal-door", () => ({
  useWorkingCareerRehearsalDoor: () => ({
    door: "career",
    mounted: true,
    setDoor: vi.fn(),
  }),
}));

vi.mock("@/hooks/session-ai-readiness-context", () => ({
  useSessionAiReadiness: () => ({
    sessionMode: "Simulator",
    hostMode: "Simulator",
    hasDevOverride: false,
    isSessionReal: false,
    isLoading: false,
    isReady: true,
    blocksExecute: false,
    detail: null,
    availability: null,
    probeState: { status: "idle" },
    checkAvailability: vi.fn(),
  }),
}));

const mountedWorkingContext = {
  mode: "working" as const,
  mounted: true,
  accountSyncState: "synced" as const,
  isWorkingMode: true,
  setAndPersist: vi.fn(),
};

describe("WorkingExecuteStartHonestyNotices", () => {
  it("renders nothing when WorkspaceModeProvider is not mounted", () => {
    const { container } = render(<WorkingExecuteStartHonestyNotices />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("working-execute-start-honesty-notices")).not.toBeInTheDocument();
  });

  it("shows Record + Simulator honesty when Working Record is selected on a non-Real host", () => {
    render(
      <WorkspaceModeContext.Provider value={mountedWorkingContext}>
        <WorkingExecuteStartHonestyNotices />
      </WorkspaceModeContext.Provider>,
    );

    expect(screen.getByTestId("working-execute-start-honesty-notices")).toBeInTheDocument();
    expect(screen.getByText(WORKING_RECORD_SIMULATOR_START_HONESTY_SENTENCE)).toBeInTheDocument();
  });
});
