import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GovernanceFindingsQueueContextStrip } from "@/components/governance/findings/GovernanceFindingsQueueContextStrip";

describe("GovernanceFindingsQueueContextStrip", () => {
  it("renders freshness, scope, results, and active filter summary", () => {
    render(
      <GovernanceFindingsQueueContextStrip
        freshnessLabel="Last refreshed: 2m ago (3:14 PM ET)"
        lastRefreshedAt={new Date("2026-09-22T19:14:00.000Z")}
        scopeLabel="Findings queue · current workspace scope"
        resultsLabel="0 of 0 findings"
        filterSummary="Open findings only"
      />,
    );

    expect(screen.getByTestId("governance-findings-queue-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-context-freshness")).toHaveTextContent(
      "Last refreshed: 2m ago",
    );
    expect(screen.getByTestId("governance-findings-queue-context-scope")).toHaveTextContent(
      "Findings queue · current workspace scope",
    );
    expect(screen.getByText("0 of 0 findings")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-context-filters")).toHaveTextContent(
      "Open findings only",
    );
  });
});
