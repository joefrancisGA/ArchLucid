import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RemediationFactoryAttackPathReportSection } from "./RemediationFactoryAttackPathReportSection";

const snapshotId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const confirmedPathId = "11111111-1111-1111-1111-111111111111";
const possiblePathId = "22222222-2222-2222-2222-222222222222";
const nsgPathId = "33333333-3333-3333-3333-333333333333";

function baseRankSummary(pathId: string, band: string, kind: string) {
  return {
    pathId,
    snapshotId,
    rankOrder: 1,
    ruleVersion: "v1",
    technicalExposureScore: 1,
    privilegeDepthScore: 1,
    blastRadiusScore: 1,
    businessConsequenceScore: null,
    confidenceBandScore: 1,
    compositeSortScore: 1,
    explanationSummary: "summary",
    pathKind: kind,
    pathConfidenceBand: band,
    computedUtc: "2026-01-01T00:00:00Z",
    relatedCutPoints: [],
  };
}

describe("RemediationFactoryAttackPathReportSection", () => {
  it("renders confirmed privilege path under vulnerable only", () => {
    const onSelectPath = vi.fn();

    render(
      <RemediationFactoryAttackPathReportSection
        snapshotId={snapshotId}
        selectedPathId={null}
        onSelectPath={onSelectPath}
        awaitingRankedSnapshot={false}
        showRankedSnapshotHint={false}
        reportQuery={{
          isLoading: false,
          isError: false,
          isFetching: false,
          isSuccess: true,
          refetch: vi.fn(),
          data: {
            snapshotId,
            vulnerableAttackPaths: [baseRankSummary(confirmedPathId, "Confirmed", "Privilege")],
            unevaluatedGroups: [],
          },
        }}
      />,
    );

    expect(screen.getByText("Vulnerable attack paths")).toBeInTheDocument();

    const row = screen.getByTestId(`security-evidence-ranked-path-row-${confirmedPathId}`);
    expect(row).toHaveTextContent("Exposed on the network. Deep privilege.");
    expect(row).not.toHaveTextContent("summary");
    expect(row).not.toHaveTextContent("Show sort key");
    expect(screen.getByTestId("remediation-factory-ranked-paths-scope")).toHaveTextContent("Recorded rank");
    expect(screen.getByTestId("attack-path-report-section")).not.toHaveTextContent("composite sort");
    expect(screen.getByTestId("attack-path-report-section")).not.toHaveTextContent("1.0000");

    fireEvent.click(screen.getByTestId(`security-evidence-path-rank-rule-${confirmedPathId}`));
    expect(row).toHaveTextContent("summary");

    expect(screen.queryByText("Could not be fully evaluated")).toBeInTheDocument();
    expect(screen.getByTestId("attack-path-report-unevaluated-empty")).toBeInTheDocument();
  });

  it("renders possible path only under could not be fully evaluated", () => {
    render(
      <RemediationFactoryAttackPathReportSection
        snapshotId={snapshotId}
        selectedPathId={null}
        onSelectPath={vi.fn()}
        awaitingRankedSnapshot={false}
        showRankedSnapshotHint={false}
        reportQuery={{
          isLoading: false,
          isError: false,
          isFetching: false,
          isSuccess: true,
          refetch: vi.fn(),
          data: {
            snapshotId,
            vulnerableAttackPaths: [],
            unevaluatedGroups: [
              {
                reasonCode: "control-plane-only-no-observed-traffic",
                whyText:
                  "The control plane allows this path. Observed traffic was not collected, so the path is not listed as vulnerable.",
                pathCount: 1,
                pathIds: [possiblePathId],
                engineName: null,
                limitValue: null,
                pathsEmitted: null,
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText(/Observed traffic was not collected/)).toBeInTheDocument();
    expect(screen.getByTestId(`attack-path-report-path-link-${possiblePathId}`)).toBeInTheDocument();
    expect(screen.getByTestId("attack-path-report-vulnerable-empty")).toBeInTheDocument();
  });

  it("shows nsg gap group with path link", () => {
    render(
      <RemediationFactoryAttackPathReportSection
        snapshotId={snapshotId}
        selectedPathId={null}
        onSelectPath={vi.fn()}
        awaitingRankedSnapshot={false}
        showRankedSnapshotHint={false}
        reportQuery={{
          isLoading: false,
          isError: false,
          isFetching: false,
          isSuccess: true,
          refetch: vi.fn(),
          data: {
            snapshotId,
            vulnerableAttackPaths: [],
            unevaluatedGroups: [
              {
                reasonCode: "nsg-not-collected-or-unassociated",
                whyText:
                  "A subnet on this path has no collected network security rules, so reachability was not fully evaluated.",
                pathCount: 1,
                pathIds: [nsgPathId],
                engineName: null,
                limitValue: null,
                pathsEmitted: null,
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText(/no collected network security rules/)).toBeInTheDocument();
    expect(screen.getByTestId(`attack-path-report-path-link-${nsgPathId}`)).toBeInTheDocument();
  });

  it("shows max paths coverage without path link", () => {
    render(
      <RemediationFactoryAttackPathReportSection
        snapshotId={snapshotId}
        selectedPathId={null}
        onSelectPath={vi.fn()}
        awaitingRankedSnapshot={false}
        showRankedSnapshotHint={false}
        reportQuery={{
          isLoading: false,
          isError: false,
          isFetching: false,
          isSuccess: true,
          refetch: vi.fn(),
          data: {
            snapshotId,
            vulnerableAttackPaths: [],
            unevaluatedGroups: [
              {
                reasonCode: "search-stopped-max-paths",
                whyText: "Path search stopped after 20 paths. Later paths in that engine were not enumerated.",
                pathCount: null,
                pathIds: [],
                engineName: "Privilege",
                limitValue: 20,
                pathsEmitted: 20,
              },
            ],
          },
        }}
      />,
    );

    expect(screen.getByText(/Engine: Privilege/)).toBeInTheDocument();
    expect(screen.getByText(/Paths emitted: 20/)).toBeInTheDocument();
    expect(screen.queryByTestId(/attack-path-report-path-link-/)).not.toBeInTheDocument();
  });

  it("selects path from unevaluated link", () => {
    const onSelectPath = vi.fn();

    render(
      <RemediationFactoryAttackPathReportSection
        snapshotId={snapshotId}
        selectedPathId={null}
        onSelectPath={onSelectPath}
        awaitingRankedSnapshot={false}
        showRankedSnapshotHint={false}
        reportQuery={{
          isLoading: false,
          isError: false,
          isFetching: false,
          isSuccess: true,
          refetch: vi.fn(),
          data: {
            snapshotId,
            vulnerableAttackPaths: [],
            unevaluatedGroups: [
              {
                reasonCode: "control-plane-only-no-observed-traffic",
                whyText: "control plane",
                pathCount: 1,
                pathIds: [possiblePathId],
                engineName: null,
                limitValue: null,
                pathsEmitted: null,
              },
            ],
          },
        }}
      />,
    );

    fireEvent.click(screen.getByTestId(`attack-path-report-path-link-${possiblePathId}`));
    expect(onSelectPath).toHaveBeenCalledWith(possiblePathId);
  });
});
