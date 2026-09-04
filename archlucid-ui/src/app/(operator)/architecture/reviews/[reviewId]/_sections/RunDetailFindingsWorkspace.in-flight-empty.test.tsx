import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailFindingsWorkspace } from "./RunDetailFindingsWorkspace";
import {
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY,
} from "@/lib/architecture/architecture-created-findings-sources";

const navigationMocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: (): { refresh: () => void } => ({ refresh: (): void => {} }),
    usePathname: (): string => "/architecture/reviews/run-in-flight",
    useSearchParams: () => navigationMocks.searchParams,
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api/itsm-outbound-api", () => ({
  listItsmFindingCorrelations: vi.fn().mockResolvedValue({ correlations: [] }),
  createItsmOutboundIssue: vi.fn(),
}));

vi.mock("@/lib/use-itsm-native-create-enabled", () => ({
  useItsmNativeCreateEnabled: () => true,
}));

describe("RunDetailFindingsWorkspace committed in-flight empty (RS-05)", () => {
  it("shows honest in-progress empty state on committed review detail while analysis runs", () => {
    render(
      <RunDetailFindingsWorkspace
        runId="run-in-flight"
        findings={[]}
        packageCommitted
        analysisStagesComplete={false}
      />,
    );

    expect(screen.getByTestId("quick-decision-review-detail-in-progress-empty")).toBeInTheDocument();
    expect(screen.getByText(ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY)).toBeInTheDocument();
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK }),
    ).toHaveAttribute("href", expect.stringContaining("reviewTab=activity"));
  });
});
