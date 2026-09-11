import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/runs/RunDetailMinimalChromeMount", () => ({
  RunDetailMinimalChromeMount: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/live-operator-shell-recovery", () => ({
  isLiveOperatorShellRecoveryContext: () => true,
}));

vi.mock("@/lib/error-telemetry", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/lib/auth/error-boundary-idle-snapshot", () => ({
  persistLivelihoodIdleSnapshotsBeforeErrorRecovery: () => false,
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ reviewId: "run-abc" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/architecture/reviews/run-abc",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({
    mode: "working",
    mounted: true,
    accountSyncState: "synced",
    isWorkingMode: true,
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-effective-working-career-rehearsal-door", () => ({
  useEffectiveWorkingCareerRehearsalDoor: () => ({
    door: "rehearsal",
    effectiveDoor: "rehearsal",
    mounted: true,
  }),
}));

vi.mock("@/hooks/use-operator-scope-query-key", () => ({
  useOperatorScopeQueryKey: () => ({ tenantId: "tenant-a", projectId: "project-a" }),
}));

vi.mock("@/lib/error-recovery/read-error-recovery-run-stamp-from-cache", () => ({
  readErrorRecoveryRunStampFromCache: () => ({
    structuralExecutionMode: "Simulator",
    workingCareerRehearsalDoor: "rehearsal",
  }),
}));

import RunDetailSegmentError from "@/app/(operator)/architecture/reviews/[reviewId]/error";

describe("RunDetailSegmentError (LW-096)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leads with Retry and renders the recovery contract markers", () => {
    const reset = vi.fn();

    render(<RunDetailSegmentError error={new Error("chunk failed")} reset={reset} />);

    expect(screen.getByTestId("operator-error-recovery-contract")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-intact")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-next-step")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-next-step")).toHaveTextContent(
      /does not change execute posture/i,
    );
    expect(screen.getByTestId("error-recovery-career-honesty-strip")).toBeInTheDocument();
    expect(screen.getByTestId("error-recovery-career-honesty-body")).toHaveTextContent(
      /does not mark a rehearsal run Career-complete/i,
    );

    const retry = screen.getByTestId("review-detail-segment-error-retry");
    const back = screen.getByTestId("review-detail-segment-error-back");

    expect(retry).toHaveTextContent("Retry");
    expect(back).toHaveTextContent("Back to reviews");
    expect(retry.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(retry);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
