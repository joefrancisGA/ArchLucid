import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID } from "@/app/(operator)/governance/remediation-factory/remediation-factory-page-copy";
import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import {
  SECURENOW_PATH_INSPECT_EMPTY_NO_PATH,
  SECURENOW_PATH_INSPECT_PANEL_TITLE,
  SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
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

function renderPanel(
  findingId: string | null,
  extraProps: Partial<React.ComponentProps<typeof SecurityEvidencePathInspectPanel>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SecurityEvidencePathInspectPanel findingId={findingId} {...extraProps} />
    </QueryClientProvider>,
  );
}

describe("SecurityEvidencePathInspectPanel", () => {
  it("shows the path rank reader sentence on the identity header", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useOperationalSecurityFindingDetailQuery>);
    vi.mocked(useSecurityEvidencePathDetailQuery).mockReturnValue({
      data: {
        pathId: "path-1",
        snapshotId: "snapshot-1",
        pathKind: "PrivilegePath",
        pathConfidenceBand: "HighlyLikely",
        weakestHopOrdinal: 1,
        weakestHopReason: "Gap",
        hops: [],
        weakestHop: null,
        explanationTemplate: {
          actor: null,
          identity: null,
          network: null,
          asset: null,
          weakControl: null,
          proposedChange: "",
          verify: "",
          architectSentence: null,
        },
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

    renderPanel(null, {
      pathIdOverride: "path-1",
      selectedPath: {
        pathId: "path-1",
        snapshotId: "snapshot-1",
        rankOrder: 1,
        ruleVersion: "SA-09-v1",
        technicalExposureScore: 0.9,
        privilegeDepthScore: 0.8,
        blastRadiusScore: 0.1,
        businessConsequenceScore: null,
        confidenceBandScore: 0.6,
        compositeSortScore: 0.8123,
        explanationSummary: "SA09-rank-v1: stored summary for disclosure.",
        pathKind: "PrivilegePath",
        pathConfidenceBand: "HighlyLikely",
        computedUtc: "2026-01-01T00:00:00Z",
        relatedCutPoints: [],
      },
    });

    const identity = screen.getByTestId("security-evidence-path-inspect-identity");
    expect(identity).toHaveTextContent("Exposed on the network. Deep privilege.");
    expect(identity).not.toHaveTextContent("SA09-rank-v1");
    expect(identity).not.toHaveTextContent("0.8123");

    fireEvent.click(screen.getByTestId("security-evidence-path-rank-rule-path-1"));
    expect(identity).toHaveTextContent("SA09-rank-v1: stored summary for disclosure.");

    fireEvent.click(screen.getByTestId("security-evidence-path-rank-sort-key-path-1"));
    expect(identity).toHaveTextContent(
      "Composite sort key 0.8123. Ordering only — not a percentage, probability, or live risk score.",
    );
  });

  it("shows subject identity and compact empty copy when nothing is selected", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: undefined,
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

    renderPanel(null, {
      selectPromptPreset: {
        title: "Select a queue row",
        description: SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
        testId: "security-evidence-path-inspect-select-prompt",
      },
    });

    expect(screen.getByTestId("security-evidence-path-inspect-select-prompt")).toBeInTheDocument();
  });

  it("hides the finding sort key until Show sort key is opened", () => {
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
        pathConfidenceBand: "HighlyLikely",
        weakestHopOrdinal: 1,
        weakestHopReason: "Gap",
        hops: [],
        weakestHop: null,
        explanationTemplate: {
          actor: null,
          identity: null,
          network: null,
          asset: null,
          weakControl: null,
          proposedChange: "",
          verify: "",
          architectSentence: null,
        },
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

    renderPanel("finding-1", {
      selectedFinding: {
        findingId: "finding-1",
        totalScore: 0.5,
        explanationSummary: "Sample",
        breakdownJson: "[]",
        controlId: "AC-2",
        patternKey: "storage.encrypt",
        rankOrder: 3,
      },
      selectedPath: null,
    });

    const identity = screen.getByTestId("security-evidence-path-inspect-identity");
    expect(identity).toHaveTextContent("Finding rank 3");
    expect(identity).not.toHaveTextContent("Sort key 0.5000");
    expect(identity).not.toHaveTextContent("0.5000");

    fireEvent.click(screen.getByTestId("remediation-priority-sort-key-finding-1"));
    expect(identity).toHaveTextContent(
      "Sort key 0.5000. Ordering only — not a percentage, probability, or live risk score.",
    );
  });

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

    renderPanel("finding-1", {
      selectedFinding: {
        findingId: "finding-1",
        totalScore: 0.5,
        explanationSummary: "Sample",
        breakdownJson: "[]",
        controlId: "AC-2",
        patternKey: "storage.encrypt",
      },
    });

    expect(screen.getByTestId("security-evidence-path-inspect-subject")).toHaveTextContent("AC-2");
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
            fromNodeLabel: "Hop source was not stored.",
            toNodeLabel: "Hop destination was not stored.",
            edgeType: "Relationship type was not stored",
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
            pathsCollapsedCount: 1,
            leverageScore: 1,
            collapsedPathIds: [],
          },
        ],
        routing: [
          {
            role: "TechnicalOwner",
            principalId: null,
            displayName: null,
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

    renderPanel("finding-1", {
      selectedFinding: {
        findingId: "finding-1",
        totalScore: 0.5,
        explanationSummary: "Sample",
        breakdownJson: "[]",
        rankOrder: null,
        controlId: null,
        patternKey: null,
      },
    });

    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_PATH_INSPECT_RANK_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-rank")).toHaveTextContent("Rank 2");
    expect(screen.getByTestId("security-evidence-path-inspect-subject")).toHaveTextContent(
      "Rank was not stored",
    );
    expect(screen.getByTestId("security-evidence-path-inspect-subject")).toHaveTextContent(
      "Control id was not stored",
    );
    expect(screen.getByTestId("security-evidence-path-routing")).toHaveTextContent("Owner was not stored");
    expect(screen.getByTestId("security-evidence-path-rank-dimension-blastRadius")).toHaveTextContent(
      "Shared control blast radius elevated.",
    );
    expect(screen.getByTestId("security-evidence-path-architect-sentence")).toHaveTextContent(
      "This configuration creates a path from Internet through identity principal:aaaaaaaa to asset sa1.",
    );
    expect(screen.getByTestId("security-evidence-path-weakest-hop-callout")).toBeInTheDocument();
    expect(
      screen.getByText("This is the stored weakest hop. Evidence strength was not stored."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-weakest-hop-row")).toBeInTheDocument();
    expect(screen.getAllByText("Hop source was not stored.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hop destination was not stored.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Relationship type was not stored").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("security-evidence-path-hop-provenance")[0]).toHaveTextContent("Observed fact");
    expect(screen.getAllByTestId("security-evidence-path-hop-provenance")[1]).toHaveTextContent("Derived fact");
    expect(screen.getAllByText("Possible").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-cut-points")).toBeInTheDocument();
    expect(screen.getByText("Where you could break this path.")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-rank-reader-path-1")).toHaveTextContent(
      "Exposed on the network. Wide blast radius.",
    );
    expect(screen.getByTestId("security-evidence-path-rank")).not.toHaveTextContent("0.7123");
    expect(screen.getByTestId("security-evidence-path-band-weakest-hop-limit")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-routing")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-decision-readiness")).toHaveTextContent("Verify evidence before action");
    expect(screen.getByTestId("security-evidence-path-evidence-issues")).toHaveTextContent("At least one hop is inferred");
    expect(screen.getByTestId("security-evidence-path-verification-status")).toHaveTextContent(
      "No remediation instance is linked; verification has not started.",
    );
    expect(screen.getByRole("link", { name: "Review remediation and verification" })).toHaveAttribute(
      "href", expect.stringContaining("findingId=finding-1"),
    );
  });

  it("shows omission copy for missing recommended-action values and preserves stored empty values", () => {
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
        weakestHopReason: "Gap",
        hops: [],
        weakestHop: null,
        explanationTemplate: {
          actor: null,
          identity: null,
          network: null,
          asset: null,
          weakControl: null,
          proposedChange: "",
          verify: "",
          architectSentence: null,
        },
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

    renderPanel("finding-1");

    expect(screen.getByTestId("security-evidence-path-recommended-action")).toHaveTextContent(
      "Problem statement was not stored.",
    );
    expect(screen.getByTestId("security-evidence-path-recommended-action")).toHaveTextContent(
      "Blast radius was not stored.",
    );
    expect(screen.getByTestId("security-evidence-path-recommended-action")).not.toHaveTextContent("Not cited.");
    expect(screen.queryAllByText("Not cited.")).toHaveLength(0);
    expect(screen.getByTestId("security-evidence-path-hops-empty")).toHaveTextContent("No hops were stored.");
    expect(screen.getByTestId("security-evidence-path-routing-empty")).toHaveTextContent(
      "No routing citations were stored.",
    );
    expect(screen.getByTestId("security-evidence-path-recommended-action")).toHaveTextContent(
      "Proposed change was not stored.",
    );
  });

  it("does not cite weakest-hop reason on the recommended-action evidence line", () => {
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
        weakestHopReason: "Role assignment inferred from tag metadata.",
        hops: [
          {
            hopOrdinal: 1,
            fromNodeLabel: "Internet",
            toNodeLabel: "storage",
            edgeType: "RoleAssignment",
            provenanceKind: "AiInference",
            hopConfidenceBand: "Possible",
            inferenceSource: null,
            evidenceReference: "",
            cloudResourceId: null,
          },
        ],
        weakestHop: {
          hopOrdinal: 1,
          edgeType: "RoleAssignment",
          provenanceKind: "AiInference",
          hopConfidenceBand: "Possible",
          reason: "Role assignment inferred from tag metadata.",
        },
        explanationTemplate: {
          actor: null,
          identity: null,
          network: null,
          asset: null,
          weakControl: null,
          proposedChange: "Disable public access.",
          verify: "",
          architectSentence: "Summary",
        },
        relatedCutPoints: [
          {
            cutPointId: "cut-1",
            cutKind: "Network",
            fromNodeLabel: "a",
            toNodeLabel: "b",
            explanationSummary: "Cut summary should not appear as proposed change.",
            suggestedPatternKey: null,
          },
        ],
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

    renderPanel("finding-1");

    const recommended = screen.getByTestId("security-evidence-path-recommended-action");
    expect(recommended).toHaveTextContent("Evidence citation was not stored.");
    expect(recommended).not.toHaveTextContent("Role assignment inferred from tag metadata.");
    expect(recommended).toHaveTextContent("Disable public access.");
    expect(recommended).not.toHaveTextContent("Cut summary should not appear as proposed change.");
  });

  it("links hop resource evidence when cloudResourceId is present", () => {
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
        hops: [
          {
            hopOrdinal: 1,
            fromNodeLabel: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            toNodeLabel: "Key vault",
            edgeType: "RoleAssignment",
            provenanceKind: "ObservedFact",
            hopConfidenceBand: "HighlyLikely",
            inferenceSource: null,
            evidenceReference: "evidence-1",
            cloudResourceId: "22222222-2222-2222-2222-222222222222",
          },
        ],
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

    renderPanel("finding-1");

    expect(screen.getByRole("link", { name: "Open resource evidence" })).toHaveAttribute(
      "href",
      expect.stringContaining("/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222"),
    );
    expect(screen.getByRole("link", { name: "Open resource evidence" })).toHaveAttribute(
      "href",
      expect.stringContaining("snapshotId=snapshot-1"),
    );
  });

  it("shows Internet boundary copy and no resource link when cloudResourceId is missing", () => {
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
        ],
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

    renderPanel("finding-1");

    expect(screen.getByTestId("security-evidence-path-internet-boundary")).toHaveTextContent(
      "Internet is the public boundary, not an Azure resource.",
    );
    expect(screen.queryByRole("link", { name: "Open resource evidence" })).toBeNull();
    expect(screen.queryByTestId("security-evidence-path-hop-resource-evidence")).toBeNull();
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

  it("puts an optional id on the path inspect section", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: undefined,
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

    renderPanel(null, { id: REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID });

    expect(screen.getByTestId("security-evidence-path-inspect-panel")).toHaveAttribute(
      "id",
      "remediation-factory-path-inspect",
    );
  });

  it("omits the factory panel id when no id is passed", () => {
    vi.mocked(useOperationalSecurityFindingDetailQuery).mockReturnValue({
      data: undefined,
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

    renderPanel(null);

    expect(screen.getByTestId("security-evidence-path-inspect-panel")).not.toHaveAttribute(
      "id",
      REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID,
    );
  });
});
