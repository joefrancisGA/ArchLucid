import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorRecoveryCareerHonestyStrip } from "@/components/usability/ErrorRecoveryCareerHonestyStrip";
import { ERROR_RECOVERY_WORKING_RETRY_TITLE } from "@/lib/error-recovery/error-recovery-career-honesty";

const workspaceModeMock = vi.hoisted(() => ({
  isWorkingMode: true,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: workspaceModeMock.isWorkingMode ? "working" : "guided",
    mounted: true,
    accountSyncState: "synced",
    isWorkingMode: workspaceModeMock.isWorkingMode,
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-effective-working-career-rehearsal-door", () => ({
  useEffectiveWorkingCareerRehearsalDoor: () => ({
    door: "career",
    effectiveDoor: "career",
    mounted: true,
  }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ tenantId: "tenant-a", projectId: "project-a" }),
}));

vi.mock("@/lib/error-recovery/read-error-recovery-run-stamp-from-cache", () => ({
  readErrorRecoveryRunStampFromCache: () => null,
}));

describe("ErrorRecoveryCareerHonestyStrip (CG-096)", () => {
  it("renders generic retry honesty on Working when no cached stamp", () => {
    workspaceModeMock.isWorkingMode = true;

    render(<ErrorRecoveryCareerHonestyStrip scopedRunId="run-1" />);

    expect(screen.getByTestId("error-recovery-career-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("error-recovery-career-honesty-title")).toHaveTextContent(
      ERROR_RECOVERY_WORKING_RETRY_TITLE,
    );
    expect(screen.getByTestId("error-recovery-career-honesty-body")).toHaveTextContent(
      /does not change execute posture/i,
    );
  });

  it("renders nothing in Guided mode", () => {
    workspaceModeMock.isWorkingMode = false;

    render(<ErrorRecoveryCareerHonestyStrip scopedRunId="run-1" />);

    expect(screen.queryByTestId("error-recovery-career-honesty-strip")).not.toBeInTheDocument();
  });
});
