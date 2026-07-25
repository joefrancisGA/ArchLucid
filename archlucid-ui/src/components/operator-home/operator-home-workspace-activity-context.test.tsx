import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  OperatorHomeWorkspaceActivityProvider,
  useOperatorHomeWorkspaceActivity,
} from "@/components/operator-home/operator-home-workspace-activity-context";
import { buildDemoSeededOverviewRunSummary } from "@/lib/demo-seeded-overview";

import type { RunSummary } from "@/types/authority";

function Probe(): React.JSX.Element {
  const { recentRunIds, hasWorkspaceReviews } = useOperatorHomeWorkspaceActivity();

  return (
    <>
      <div data-testid="recent-run-ids">{recentRunIds.join(",")}</div>
      <div data-testid="has-workspace-reviews">{hasWorkspaceReviews ? "yes" : "no"}</div>
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
    expect(screen.getByTestId("recent-run-ids")).not.toHaveTextContent("");
  });
});
