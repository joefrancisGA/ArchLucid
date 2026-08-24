import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitecturePosturePillarOverview } from "@/components/governance/posture/ArchitecturePosturePillarOverview";
import type { ArchitecturePostureSummary } from "@/lib/api/governance-stickiness-api";

const useGovernancePostureQuery = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-governance-posture-query", () => ({
  useGovernancePostureQuery,
}));

function createSummary(): ArchitecturePostureSummary {
  return {
    pillars: [
      {
        pillarKey: "Security",
        displayName: "Security",
        displayOrder: 1,
        findingCounts: {
          pillarKey: "Security",
          criticalCount: 0,
          errorCount: 1,
          warningCount: 2,
          infoCount: 0,
          dispositionedCount: 0,
          mutedCount: 0,
        },
        examination: {
          state: "PartiallyExamined",
          reasonText: "1 of 2 assigned packs examined in the latest snapshot.",
        },
        packAssignments: [],
      },
      {
        pillarKey: "CostEffectiveness",
        displayName: "Cost Effectiveness",
        displayOrder: 4,
        findingCounts: {
          pillarKey: "CostEffectiveness",
          criticalCount: 0,
          errorCount: 0,
          warningCount: 0,
          infoCount: 0,
          dispositionedCount: 0,
          mutedCount: 0,
        },
        examination: {
          state: "NotExamined",
          reasonText: "No assigned policy packs for this pillar.",
        },
        packAssignments: [],
      },
    ],
    reviewIntegrity: {
      criticalCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      dispositionedCount: 0,
      mutedCount: 0,
    },
    uncategorizedCount: 0,
    primaryPillarKey: "Security",
    latestSnapshotCreatedUtc: "2026-08-24T10:00:00.000Z",
    isDegraded: false,
  };
}

describe("ArchitecturePosturePillarOverview", () => {
  it("renders pillar tiles with examination state and primary highlight", () => {
    useGovernancePostureQuery.mockReturnValue({
      data: createSummary(),
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ArchitecturePosturePillarOverview projectId="proj-1" />);

    expect(screen.getByTestId("architecture-posture-pillar-overview")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-posture-pillar-Security")).toHaveAttribute("data-primary-pillar", "true");
    expect(screen.getByTestId("architecture-posture-pillar-count-Security")).toHaveTextContent("3");
    expect(screen.getByTestId("architecture-posture-examination-Security")).toHaveTextContent("Partially examined");
  });

  it("does not render when disabled", () => {
    useGovernancePostureQuery.mockReturnValue({
      data: createSummary(),
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    render(<ArchitecturePosturePillarOverview enabled={false} />);

    expect(screen.queryByTestId("architecture-posture-pillar-overview")).not.toBeInTheDocument();
  });
});
