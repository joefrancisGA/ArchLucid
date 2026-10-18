import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RemediationFactoryRankedPathsTable } from "@/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable";
import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";

const sampleRow: SecurityEvidencePathRankSummary = {
  pathId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  rankOrder: 1,
  ruleVersion: "SA-09-v1",
  technicalExposureScore: 0.9,
  privilegeDepthScore: 0.8,
  blastRadiusScore: 0.7,
  businessConsequenceScore: null,
  confidenceBandScore: 0.6,
  compositeSortScore: 0.8123,
  explanationSummary: "SA09-rank-v1: PrivilegePath path ranks by weighted dimensions.",
  pathKind: "PrivilegePath",
  pathConfidenceBand: "HighlyLikely",
  computedUtc: "2026-01-01T00:00:00Z",
  relatedCutPoints: [],
};

describe("RemediationFactoryRankedPathsTable", () => {
  it("shows the reader sentence and hides decimals until disclosures open", () => {
    render(
      <RemediationFactoryRankedPathsTable
        rows={[sampleRow]}
        selectedPathId={null}
        onSelect={vi.fn()}
        scopeLabel="All paths"
        totalCount={1}
        page={1}
        pageSize={25}
      />,
    );

    const row = screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(row).toHaveTextContent("Exposed on the network. Deep privilege.");
    expect(row).toHaveTextContent("Show sort key");
    expect(row).not.toHaveTextContent("0.8123");
    expect(row).not.toHaveTextContent("SA09-rank-v1");

    fireEvent.click(screen.getByTestId("security-evidence-path-rank-rule-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
    expect(row).toHaveTextContent("SA09-rank-v1: PrivilegePath path ranks by weighted dimensions.");

    fireEvent.click(screen.getByTestId("security-evidence-path-rank-sort-key-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
    expect(row).toHaveTextContent(
      "Composite sort key 0.8123. Ordering only — not a percentage, probability, or live risk score.",
    );
  });

  it("omits the sort key column when showSortKeyColumn is false", () => {
    render(
      <RemediationFactoryRankedPathsTable
        rows={[sampleRow]}
        selectedPathId={null}
        onSelect={vi.fn()}
        scopeLabel="Attack path report · vulnerable"
        totalCount={1}
        page={1}
        pageSize={25}
        showSortKeyColumn={false}
      />,
    );

    expect(screen.getByTestId("remediation-factory-ranked-paths-scope")).toHaveTextContent("Recorded rank");
    expect(screen.getByTestId("remediation-factory-ranked-paths-scope")).not.toHaveTextContent("composite sort");

    const row = screen.getByTestId("security-evidence-ranked-path-row-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(row).not.toHaveTextContent("Show sort key");
    expect(row).not.toHaveTextContent("0.8123");
  });
});
