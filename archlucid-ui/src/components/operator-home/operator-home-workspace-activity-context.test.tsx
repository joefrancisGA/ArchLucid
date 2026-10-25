import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  OperatorHomeWorkspaceActivityProvider,
  useOperatorHomeWorkspaceActivity,
} from "@/components/operator-home/operator-home-workspace-activity-context";
import { buildDemoSeededOverviewRunSummary } from "@/lib/demo-seeded-overview";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

import type { RunSummary } from "@/types/authority";

vi.mock("@/components/SampleReviewsOnOverviewPreferenceProvider", () => ({
  useSampleReviewsOnOverviewVisible: () => true,
}));

function Probe(): React.JSX.Element {
  const {
    recentRunIds,
    hasWorkspaceReviews,
    hasOverviewReviewRows,
    liveRunsSnapshot,
    openFindingsCount,
  } = useOperatorHomeWorkspaceActivity();

  return (
    <>
      <div data-testid="recent-run-ids">{recentRunIds.join(",")}</div>
      <div data-testid="has-workspace-reviews">{hasWorkspaceReviews ? "yes" : "no"}</div>
      <div data-testid="has-overview-review-rows">{hasOverviewReviewRows ? "yes" : "no"}</div>
      <div data-testid="live-snapshot-state">{liveRunsSnapshot === null ? "none" : "live"}</div>
      <div data-testid="live-snapshot-total">{liveRunsSnapshot?.totalCount ?? -1}</div>
      <div data-testid="open-findings-count">{openFindingsCount}</div>
    </>
  );
}

function buildRunSummary(runId: string, isArchived = false): RunSummary {
  return {
    runId,
    requestId: `req-${runId}`,
    projectId: "default",
    status: "InProgress",
    isArchived,
  } as RunSummary;
}

describe("OperatorHomeWorkspaceActivityProvider", () => {
  it("seeds recent run ids from the server snapshot", () => {
    render(
      <OperatorHomeWorkspaceActivityProvider
        initialHasReviews
        initialRecentRunIds={["11111111-aaaa-bbbb-cccc-dddddddddddd"]}
      >
        <Probe />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("recent-run-ids")).toHaveTextContent("11111111-aaaa-bbbb-cccc-dddddddddddd");
  });

  it("updates recent run ids when the runs dashboard reports live items", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() =>
            reportWorkspaceReviews([
              buildRunSummary("22222222-aaaa-bbbb-cccc-dddddddddddd"),
              buildRunSummary("33333333-aaaa-bbbb-cccc-dddddddddddd", true),
            ])
          }
        >
          Report
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("recent-run-ids")).toHaveTextContent("");

    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    expect(screen.getByTestId("recent-run-ids")).toHaveTextContent("22222222-aaaa-bbbb-cccc-dddddddddddd");
  });

  it("publishes the reported reviews snapshot so runs-derived home surfaces can refresh", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() => reportWorkspaceReviews([buildRunSummary("44444444-aaaa-bbbb-cccc-dddddddddddd")], 9)}
        >
          Report
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    expect(screen.getByTestId("live-snapshot-state")).toHaveTextContent("none");

    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    expect(screen.getByTestId("live-snapshot-state")).toHaveTextContent("live");
    expect(screen.getByTestId("live-snapshot-total")).toHaveTextContent("9");
  });

  it("falls back to the reported item count when no total count is supplied", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() =>
            reportWorkspaceReviews([
              buildRunSummary("55555555-aaaa-bbbb-cccc-dddddddddddd"),
              buildRunSummary("66666666-aaaa-bbbb-cccc-dddddddddddd"),
            ])
          }
        >
          Report
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Report" }));

    expect(screen.getByTestId("live-snapshot-total")).toHaveTextContent("2");
  });

  it("stores zero live snapshot total when only archived rows are reported without an explicit total", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() =>
            reportWorkspaceReviews([
              buildRunSummary("77777777-aaaa-bbbb-cccc-dddddddddddd", true),
              buildRunSummary("88888888-aaaa-bbbb-cccc-dddddddddddd", true),
            ])
          }
        >
          Report archived
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Report archived" }));

    expect(screen.getByTestId("live-snapshot-total")).toHaveTextContent("0");
  });

  it("keeps empty-home false when only a demo-seeded Overview inject is reported (TB-1039)", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() => reportWorkspaceReviews([buildDemoSeededOverviewRunSummary("default", null)])}
        >
          Report inject
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Report inject" }));

    expect(screen.getByTestId("has-workspace-reviews")).toHaveTextContent("no");
    expect(screen.getByTestId("has-overview-review-rows")).toHaveTextContent("yes");
    expect(screen.getByTestId("recent-run-ids")).not.toHaveTextContent("");
  });

  it("does not publish showcase sample open findings into workspace activity metrics (TB-1039)", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() =>
            reportWorkspaceReviews(
              [
                {
                  runId: SHOWCASE_STATIC_DEMO_RUN_ID,
                  requestId: "req-showcase",
                  projectId: "default",
                  status: "Completed",
                  hasGoldenManifest: true,
                  hasFindingsSnapshot: true,
                  findingCount: 42,
                } as RunSummary,
              ],
              0,
            )
          }
        >
          Report showcase
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Report showcase" }));

    expect(screen.getByTestId("open-findings-count")).toHaveTextContent("0");
  });

  it("keeps hasWorkspaceReviews false when only a description-matched showcase story is reported", () => {
    function Reporter(): React.JSX.Element {
      const { reportWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

      return (
        <button
          type="button"
          onClick={() =>
            reportWorkspaceReviews(
              [
                {
                  runId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
                  requestId: "req-showcase-story",
                  projectId: "default",
                  status: "Completed",
                  description: "Enterprise customer intake modernization review",
                  hasGoldenManifest: true,
                } as RunSummary,
              ],
              0,
            )
          }
        >
          Report story
        </button>
      );
    }

    render(
      <OperatorHomeWorkspaceActivityProvider initialHasReviews={false}>
        <Probe />
        <Reporter />
      </OperatorHomeWorkspaceActivityProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Report story" }));

    expect(screen.getByTestId("has-workspace-reviews")).toHaveTextContent("no");
    expect(screen.getByTestId("has-overview-review-rows")).toHaveTextContent("yes");
    expect(screen.getByTestId("open-findings-count")).toHaveTextContent("0");
  });
});
