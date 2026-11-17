import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ManifestTopDecisionsCard } from "./ManifestTopDecisionsCard";
import type { ManifestSummary } from "@/types/authority";

function buildSummary(overrides: Partial<ManifestSummary> = {}): ManifestSummary {
  return {
    manifestId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    runId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    createdUtc: "2026-01-01T00:00:00Z",
    manifestHash: "hash",
    ruleSetId: "rules",
    ruleSetVersion: "1",
    decisionCount: 2,
    warningCount: 0,
    unresolvedIssueCount: 0,
    status: "Committed",
    hasWarnings: false,
    hasUnresolvedIssues: false,
    operatorSummary: "2 decisions",
    topDecisionSynopses: ["Gateway: Azure Application Gateway", "Data: SQL"],
    ...overrides,
  };
}

describe("ManifestTopDecisionsCard", () => {
  it("renders API decision excerpts for non-showcase manifests (BDA-146)", () => {
    render(<ManifestTopDecisionsCard summary={buildSummary()} buyerPolishedLayout />);

    expect(screen.getByTestId("manifest-top-decision-excerpts")).toBeInTheDocument();
    expect(screen.getByText("Gateway: Azure Application Gateway")).toBeInTheDocument();
    expect(screen.getByText("Data: SQL")).toBeInTheDocument();
  });

  it("labels omitted and empty decision previews and keeps zero decision count visible", () => {
    const { rerender } = render(
      <ManifestTopDecisionsCard summary={buildSummary({ decisionCount: 0, topDecisionSynopses: undefined })} />,
    );

    expect(screen.getByText(/decision previews were not stored/i)).toBeInTheDocument();

    rerender(
      <ManifestTopDecisionsCard summary={buildSummary({ decisionCount: 0, topDecisionSynopses: [] })} />,
    );

    expect(screen.getByText(/decision previews were stored empty/i)).toBeInTheDocument();
    expect(screen.getByText(/records/)).toHaveTextContent("0");
  });
});
