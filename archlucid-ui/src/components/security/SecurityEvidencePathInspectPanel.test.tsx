import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import {
  SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";

vi.mock("@/hooks/use-operational-security-finding-detail-query", () => ({
  useOperationalSecurityFindingDetailQuery: vi.fn(),
}));

vi.mock("@/hooks/use-security-evidence-path-detail-query", () => ({
  useSecurityEvidencePathDetailQuery: vi.fn(),
}));

vi.mock("@/hooks/use-security-evidence-path-rank-query", () => ({
  useSecurityEvidencePathRankQuery: vi.fn(),
}));

vi.mock("@/lib/security-evidence-path-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security-evidence-path-api")>();

  return {
    ...actual,
    buildSecurityEvidencePathExplanation: vi.fn(),
  };
});

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => []),
}));

import { useOperationalSecurityFindingDetailQuery } from "@/hooks/use-operational-security-finding-detail-query";
import { useSecurityEvidencePathDetailQuery } from "@/hooks/use-security-evidence-path-detail-query";
import { useSecurityEvidencePathRankQuery } from "@/hooks/use-security-evidence-path-rank-query";
import { buildSecurityEvidencePathExplanation } from "@/lib/security-evidence-path-api";
import {
  SECURENOW_PATH_INSPECT_RANK_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";

function renderPanel(findingId: string | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SecurityEvidencePathInspectPanel findingId={findingId} />
    </QueryClientProvider>,
  );
}

describe("SecurityEvidencePathInspectPanel", () => {
  it("shows resource-scoped empty copy when finding has no pathId", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: { findingId: "finding-1", pathId: null, title: "Test finding" },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOperationalSecurityFindingDetailQuery>);
    vi.mocked(useSecurityEvidencePathDetailQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathDetailQuery>);
    vi.mocked(useSecurityEvidencePathRankQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathRankQuery>);

    renderPanel("finding-1");

    expect(screen.getByTestId("security-evidence-path-inspect-empty")).toHaveTextContent(
      SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
    );
  });

  it("renders hops with provenance labels and weakest hop callout", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: { findingId: "finding-1", pathId: "path-1", title: "Path finding" },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOperationalSecurityFindingDetailQuery>);
    vi.mocked(useSecurityEvidencePathDetailQuery).mockReturnValue({
      data: {
        pathId: "path-1",
        snapshotId: "snapshot-1",
        pathKind: "PrivilegePath",
        pathConfidenceBand: "Possible",
        weakestHopOrdinal: 2,
        weakestHopReason: "Role assignment inferred from tag metadata.",
        hops: [
          {
            hopOrdinal: 1,
            fromNodeLabel: "Internet",
            toNodeLabel: "App gateway",
            edgeType: "PublicExposure",
            provenanceKind: "ObservedFact",
            hopConfidenceBand: "HighlyLikely",
            inferenceSource: null,
            evidenceReference: "evidence-1",
            cloudResourceId: null,
          },
          {
            hopOrdinal: 2,
            fromNodeLabel: "App gateway",
            toNodeLabel: "Key vault",
            edgeType: "RoleAssignment",
            provenanceKind: "DerivedFact",
            hopConfidenceBand: "Possible",
            inferenceSource: "tag:owner",
            evidenceReference: "evidence-2",
            cloudResourceId: null,
          },
        ],
        weakestHop: {
          hopOrdinal: 2,
          edgeType: "RoleAssignment",
          hopConfidenceBand: "Possible",
          provenanceKind: "DerivedFact",
          reason: "Role assignment inferred from tag metadata.",
        },
        explanationTemplate: {
          actor: "Internet",
          identity: "principal:aaaaaaaa",
          network: null,
          asset: "sa1",
          weakControl: "Role assignment inferred from tag metadata.",
          proposedChange: "network restrict public",
          verify: "snapshot:verify-public-closure",
          architectSentence:
            "This configuration creates a path from Internet through identity principal:aaaaaaaa to asset sa1. The path exists because role assignment inferred from tag metadata. Change network restrict public will break the path with minimal operational risk. Verify using snapshot:verify-public-closure.",
        },
        relatedCutPoints: [
          {
            cutPointId: "cut-1",
            cutKind: "RemovePublicExposure",
            cutOrder: 1,
            fromNodeLabel: "Internet",
            toNodeLabel: "App gateway",
            edgeType: "PublicExposure",
            explanationSummary: "Remove public network path before privilege hop.",
            suggestedPatternKey: "network.restrict-public",
            operationalCostClass: "Low",
          },
        ],
        routing: [
          {
            role: "TechnicalOwner",
            principalId: "owner-1",
            displayName: "Platform team",
            provenanceKind: "DerivedFact",
            sourceReference: "tag:technicalOwner",
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathDetailQuery>);
    vi.mocked(useSecurityEvidencePathRankQuery).mockReturnValue({
      data: {
        pathId: "path-1",
        snapshotId: "snapshot-1",
        rankOrder: 2,
        ruleVersion: "SA-09-v1",
        technicalExposureScore: 0.8,
        privilegeDepthScore: 0.6,
        blastRadiusScore: 0.7,
        businessConsequenceScore: null,
        confidenceBandScore: 0.5,
        compositeSortScore: 0.7123,
        explanationSummary: "High privilege depth with public exposure.",
        breakdownJson: "[]",
        pathKind: "PrivilegePath",
        pathConfidenceBand: "Possible",
        dimensionProse: {
          technicalExposure: "Public endpoint observed.",
          privilegeDepth: "Owner role on target.",
          blastRadius: "Shared control blast radius elevated.",
          businessConsequence: "",
          confidenceBand: "Possible band caps rank.",
          overall: "Rank driven by privilege depth and exposure.",
        },
        computedUtc: "2026-01-01T00:00:00Z",
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathRankQuery>);

    renderPanel("finding-1");

    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_INSPECT_RANK_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-rank")).toHaveTextContent("Rank 2");
    expect(screen.getByTestId("security-evidence-path-rank-dimension-blastRadius")).toHaveTextContent(
      "Shared control blast radius elevated.",
    );
    expect(screen.getByTestId("security-evidence-path-architect-sentence")).toHaveTextContent(
      "This configuration creates a path from Internet through identity principal:aaaaaaaa to asset sa1.",
    );
    expect(screen.getByTestId("security-evidence-path-weakest-hop-callout")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-weakest-hop-row")).toBeInTheDocument();
    expect(screen.getAllByTestId("security-evidence-path-hop-provenance")[0]).toHaveTextContent("Observed fact");
    expect(screen.getAllByTestId("security-evidence-path-hop-provenance")[1]).toHaveTextContent("Derived fact");
    expect(screen.getAllByText("Possible").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-cut-points")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-routing")).toBeInTheDocument();
  });

  it("generates simulator explanation for the selected path", async () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: { findingId: "finding-1", pathId: "path-1", title: "Path finding" },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOperationalSecurityFindingDetailQuery>);
    vi.mocked(useSecurityEvidencePathDetailQuery).mockReturnValue({
      data: {
        pathId: "path-1",
        snapshotId: "snapshot-1",
        pathKind: "PrivilegePath",
        pathConfidenceBand: "Possible",
        weakestHopOrdinal: 1,
        weakestHopReason: "Public exposure.",
        hops: [],
        weakestHop: null,
        explanationTemplate: null,
        relatedCutPoints: [],
        routing: [],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathDetailQuery>);
    vi.mocked(useSecurityEvidencePathRankQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathRankQuery>);
    vi.mocked(buildSecurityEvidencePathExplanation).mockResolvedValue({
      succeeded: true,
      errorMessage: null,
      explanation: {
        explanationId: "explanation-1",
        pathId: "path-1",
        executiveSummary: "Simulator summary for the cited path.",
        businessImpactHypotheses: ["Hypothesis one"],
        proposedRemediation: {
          recommendedChange: "Restrict public access",
          recommendedChangeSource: "cut-point",
          verificationQueries: ["snapshot:verify-public-closure"],
          preconditions: [],
          suggestedPatternKey: "network.restrict-public",
        },
        citedEvidenceRefs: ["path:path-1"],
        provenanceKind: "DeterministicInference",
        simulatorLabel: "SIMULATOR",
        createdUtc: "2026-01-01T00:00:00Z",
      },
    });

    renderPanel("finding-1");

    fireEvent.click(screen.getByTestId("security-evidence-path-explanation-button"));

    expect(await screen.findByTestId("security-evidence-path-explanation-output")).toHaveTextContent(
      "Simulator summary for the cited path.",
    );
    expect(buildSecurityEvidencePathExplanation).toHaveBeenCalledWith("path-1", {
      useSimulator: true,
      allowInsufficientEvidence: false,
    });
  });

  it("loads path inspect directly from pathId override without a finding", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOperationalSecurityFindingDetailQuery>);
    vi.mocked(useSecurityEvidencePathDetailQuery).mockReturnValue({
      data: {
        pathId: "path-direct",
        snapshotId: "snapshot-1",
        pathKind: "PrivilegePath",
        pathConfidenceBand: "HighlyLikely",
        weakestHopOrdinal: 1,
        weakestHopReason: "Direct path selection.",
        hops: [],
        weakestHop: null,
        explanationTemplate: null,
        relatedCutPoints: [],
        routing: [],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathDetailQuery>);
    vi.mocked(useSecurityEvidencePathRankQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSecurityEvidencePathRankQuery>);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SecurityEvidencePathInspectPanel findingId={null} pathIdOverride="path-direct" />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Highly likely")).toBeInTheDocument();
    expect(screen.queryByTestId("security-evidence-path-inspect-empty")).not.toBeInTheDocument();
  });
});
