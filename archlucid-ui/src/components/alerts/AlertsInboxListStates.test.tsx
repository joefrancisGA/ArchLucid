import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsInboxListStates } from "@/components/alerts/AlertsInboxListStates";

const emptyProps = {
  testId: "alerts-inbox-empty-state",
  title: "No open alerts",
  description: "All clear.",
};

describe("AlertsInboxListStates TB-1598", () => {
  it("shows a list loading skeleton instead of loading copy while alerts fetch", () => {
    render(
      <AlertsInboxListStates
        loading={true}
        hasLoadFailure={false}
        visibleAlertCount={0}
        alertCount={0}
        emptyFilteredProps={emptyProps}
      />,
    );

    expect(screen.getByTestId("alerts-inbox-list-loading-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Loading alerts…")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alerts-inbox-empty-state")).not.toBeInTheDocument();
  });

  it("shows the empty state when loading has finished with no visible alerts", () => {
    render(
      <AlertsInboxListStates
        loading={false}
        hasLoadFailure={false}
        visibleAlertCount={0}
        alertCount={0}
        emptyFilteredProps={emptyProps}
      />,
    );

    expect(screen.queryByTestId("alerts-inbox-list-loading-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("alerts-inbox-empty-state")).toBeInTheDocument();
  });
});
