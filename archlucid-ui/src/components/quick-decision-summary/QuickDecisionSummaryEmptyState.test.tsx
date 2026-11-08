import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickDecisionSummaryEmptyState } from "@/components/quick-decision-summary/QuickDecisionSummaryEmptyState";
import type { QuickDecisionSummaryProps } from "@/components/quick-decision-summary/types";

function baseProps(overrides: Partial<QuickDecisionSummaryProps> = {}): QuickDecisionSummaryProps {
  return {
    runId: "run-1",
    packageCommitted: true,
    analysisStagesComplete: true,
    ...overrides,
  };
}

describe("QuickDecisionSummaryEmptyState (P-14)", () => {
  it("labels omitted headline finding count on committed reviews", () => {
    render(
      <QuickDecisionSummaryEmptyState
        props={baseProps({ analysisStagesComplete: true })}
        buyerPolishedShell={false}
        headlineFindingCount={null}
        headlineWarningCount={0}
      />,
    );

    expect(screen.getByTestId("quick-decision-headline-count-not-stored")).toHaveTextContent(
      "Manifest headline finding count was not stored.",
    );
  });

  it("labels stored zero headline finding count (P-16)", () => {
    render(
      <QuickDecisionSummaryEmptyState
        props={baseProps()}
        buyerPolishedShell={false}
        headlineFindingCount={0}
        headlineWarningCount={0}
      />,
    );

    expect(screen.getByTestId("quick-decision-headline-count-stored-zero")).toHaveTextContent(
      "Manifest headline finding count was stored as zero.",
    );
  });

  it("does not imply zero monitored risks when warning count is omitted", () => {
    render(
      <QuickDecisionSummaryEmptyState
        props={baseProps()}
        buyerPolishedShell={true}
        headlineFindingCount={3}
        headlineWarningCount={null}
      />,
    );

    expect(screen.getByText(/records 3 findings on the manifest headline/)).toBeInTheDocument();
    expect(screen.queryByText(/no unresolved blocking issues/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PHI minimization risk/)).not.toBeInTheDocument();
  });

  it("states stored zero monitored risks when headline warning count is zero (P-10)", () => {
    render(
      <QuickDecisionSummaryEmptyState
        props={baseProps()}
        buyerPolishedShell={true}
        headlineFindingCount={2}
        headlineWarningCount={0}
      />,
    );

    expect(screen.getByText(/Monitored risk count was stored as zero/)).toBeInTheDocument();
  });

  it("does not say no findings to act on when workspace headline count is positive (P-10)", () => {
    render(
      <QuickDecisionSummaryEmptyState
        props={baseProps()}
        buyerPolishedShell={false}
        headlineFindingCount={4}
        headlineWarningCount={null}
      />,
    );

    expect(screen.getByTestId("quick-decision-workspace-headline-findings")).toHaveTextContent(
      "Manifest headline records 4 findings",
    );
    expect(screen.queryByText("No findings to act on")).not.toBeInTheDocument();
  });
});
