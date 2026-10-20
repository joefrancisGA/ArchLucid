import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManifestDetailSummaryCountsGrid } from "@/components/ManifestDetailSummaryCountsGrid";
import type { ManifestSummary } from "@/types/authority";

const summary: ManifestSummary = {
  manifestId: "manifest-1",
  runId: "run-1",
  status: "Committed",
  decisionCount: 2,
  warningCount: 1,
  unresolvedIssueCount: 0,
  committedUtc: "2026-06-01T00:00:00Z",
  ruleSetId: "pack-a",
  ruleSetVersion: "1",
};

describe("ManifestDetailSummaryCountsGrid", () => {
  it("renders Not returned for non-finite summary counts", () => {
    render(
      <ManifestDetailSummaryCountsGrid
        summary={{
          ...summary,
          decisionCount: Number.NaN,
          warningCount: undefined as never,
          unresolvedIssueCount: null as never,
        }}
        buyerPolishedLayout={false}
      />,
    );

    expect(screen.getAllByText("Not returned")).toHaveLength(3);
  });
});
