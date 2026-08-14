import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorHomeDoThisNextCard } from "@/components/operator-home/OperatorHomeDoThisNextCard";
import {
  OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA,
  OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
  OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_SAMPLE_REVIEW_REGISTRY } from "@/lib/showcase-sample-review-registry";

const shouldInjectDemoSeededOverviewSample = vi.fn();
const isDemoSeededOverviewWorkspaceLabel = vi.fn();
const resolveDemoSeededOverviewSamplePackage = vi.fn();

vi.mock("@/lib/demo-seeded-overview", () => ({
  shouldInjectDemoSeededOverviewSample: (...args: unknown[]) => shouldInjectDemoSeededOverviewSample(...args),
  isDemoSeededOverviewWorkspaceLabel: (...args: unknown[]) => isDemoSeededOverviewWorkspaceLabel(...args),
  resolveDemoSeededOverviewSamplePackage: (...args: unknown[]) => resolveDemoSeededOverviewSamplePackage(...args),
}));

vi.mock("@/hooks/use-finish-setup-readiness-context", () => ({
  useFinishSetupReadinessContext: vi.fn(),
}));

vi.mock("@/hooks/use-featured-completed-sample-query", () => ({
  useFeaturedCompletedSampleQuery: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "11111111-1111-1111-1111-111111111111",
    "x-workspace-id": "22222222-2222-2222-2222-222222222222",
    "x-project-id": "33333333-3333-3333-3333-333333333333",
  }),
  readOperatorScopeFromStorage: () => null,
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

import { useFeaturedCompletedSampleQuery } from "@/hooks/use-featured-completed-sample-query";
import { useFinishSetupReadinessContext } from "@/hooks/use-finish-setup-readiness-context";

describe("OperatorHomeDoThisNextCard", () => {
  beforeEach(() => {
    shouldInjectDemoSeededOverviewSample.mockReturnValue(false);
    isDemoSeededOverviewWorkspaceLabel.mockReturnValue(false);
    resolveDemoSeededOverviewSamplePackage.mockReturnValue({
      runId: SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId,
      href: `/architecture/reviews/${SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId}`,
      label: OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
    });
  });

  it("shows Open sample review on demo-seeded empty Overview (TB-1039)", async () => {
    shouldInjectDemoSeededOverviewSample.mockReturnValue(true);
    vi.mocked(useFinishSetupReadinessContext).mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      readyCount: 2,
      totalCount: 2,
    });
    vi.mocked(useFeaturedCompletedSampleQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        selectedRunId: "claims-intake-modernization",
        isConfigured: true,
        isAvailable: true,
        reviewTitle: "Claims intake modernization",
        architectureName: "Claims intake modernization",
        completedUtc: "2026-01-01T00:00:00.000Z",
        isSampleApproved: true,
      },
    } as ReturnType<typeof useFeaturedCompletedSampleQuery>);

    render(<OperatorHomeDoThisNextCard />);

    expect(screen.getByTestId("operator-home-do-this-next")).toBeInTheDocument();
    expect(screen.queryByText("Do this next")).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-do-this-next-primary")).toHaveTextContent(
        OPERATOR_HOME_OPEN_SAMPLE_PACKAGE_CTA,
      );
    });

    const primary = screen.getByTestId("operator-home-do-this-next-primary");
    expect(primary).toHaveAttribute("href", `/architecture/reviews/${SHOWCASE_SAMPLE_REVIEW_REGISTRY.runId}`);

    const card = screen.getByTestId("operator-home-do-this-next");
    expect(within(card).getAllByTestId("operator-home-do-this-next-primary")).toHaveLength(1);
    expect(screen.queryByTestId("operator-home-do-this-next-secondary")).toBeNull();
  });

  it("does not ship duplicate educational secondaries to architecture workflow help (TB-1994 / TB-1995)", async () => {
    shouldInjectDemoSeededOverviewSample.mockReturnValue(true);
    vi.mocked(useFinishSetupReadinessContext).mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: true,
      },
      readyCount: 2,
      totalCount: 2,
    });
    vi.mocked(useFeaturedCompletedSampleQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        selectedRunId: "claims-intake-modernization",
        isConfigured: true,
        isAvailable: true,
        reviewTitle: "Claims intake modernization",
        architectureName: "Claims intake modernization",
        completedUtc: "2026-01-01T00:00:00.000Z",
        isSampleApproved: true,
      },
    } as ReturnType<typeof useFeaturedCompletedSampleQuery>);

    render(<OperatorHomeDoThisNextCard />);

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-do-this-next-primary")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("operator-home-do-this-next-secondary")).toBeNull();
    expect(screen.queryByRole("link", { name: OPERATOR_HOME_LEARN_HOW_REVIEWS_WORK_CTA })).toBeNull();
    expect(screen.queryByRole("link", { name: OPERATOR_HOME_EXPLORE_REVIEW_WALKTHROUGH_CTA })).toBeNull();
  });

  it("promotes admin setup when readiness blocks beginning on a real empty tenant", async () => {
    shouldInjectDemoSeededOverviewSample.mockReturnValue(false);
    isDemoSeededOverviewWorkspaceLabel.mockReturnValue(false);
    vi.mocked(useFinishSetupReadinessContext).mockReturnValue({
      phase: "ready",
      context: {
        healthReady: true,
        healthLoadFailed: false,
        principalAdmin: false,
      },
      readyCount: 0,
      totalCount: 2,
    });
    vi.mocked(useFeaturedCompletedSampleQuery).mockReturnValue({
      isPending: false,
      isError: false,
      data: undefined,
    } as ReturnType<typeof useFeaturedCompletedSampleQuery>);

    render(<OperatorHomeDoThisNextCard />);

    await waitFor(() => {
      expect(screen.getByTestId("operator-home-do-this-next-primary")).toHaveTextContent("Manage roles");
    });
  });
});
