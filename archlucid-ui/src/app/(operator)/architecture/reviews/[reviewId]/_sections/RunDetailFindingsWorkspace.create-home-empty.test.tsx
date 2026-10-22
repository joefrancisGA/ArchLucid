import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY,
} from "@/lib/architecture/architecture-created-findings-sources";

import { RunDetailFindingsWorkspace } from "./RunDetailFindingsWorkspace";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigationMocks.searchParams,
  useRouter: (): { refresh: () => void } => ({ refresh: (): void => {} }),
  usePathname: () => "/architecture/reviews/run-empty",
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => false,
}));

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => ({
      mode: "guided",
      mounted: true,
      accountSyncState: "synced",
      isWorkingMode: false,
      setAndPersist: vi.fn(),
    }),
  };
});

vi.mock("@/components/findings/RunDetailFindingsCardViewLazy", async () => {
  const { QuickDecisionSummary } = await import("@/components/QuickDecisionSummary");

  return {
    RunDetailFindingsCardViewLazy: (props: Record<string, unknown>) => (
      <QuickDecisionSummary {...props} workspaceCardMode />
    ),
  };
});

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelations: vi.fn().mockResolvedValue({ correlations: [] }),
  createItsmOutboundIssue: vi.fn(),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => true,
}));

describe("RunDetailFindingsWorkspace create-home empty composition (TB-1853)", () => {
  it("shows honest in-progress empty state with Activity and Clarifications CTAs", () => {
    render(
      <RunDetailFindingsWorkspace
        runId="run-empty"
        findings={[]}
        packageCommitted={false}
        analysisStagesComplete={false}
      />,
    );

    expect(screen.getByTestId("run-detail-findings-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("quick-decision-create-home-in-progress-empty")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY)).toBeInTheDocument();
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK }),
    ).toHaveAttribute("href", expect.stringContaining("reviewTab=activity"));
    expect(
      screen.getByRole("link", { name: ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_CLARIFICATIONS_LINK }),
    ).toHaveAttribute("href", expect.stringContaining("reviewTab=decisions-remediation"));
    expect(
      screen.getByRole("link", { name: ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK }),
    ).toHaveAttribute("href", expect.stringContaining("fromGeneration=1"));
  });
});
