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
});
