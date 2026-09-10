import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => []),
}));

import { useOperationalSecurityFindingDetailQuery } from "@/hooks/use-operational-security-finding-detail-query";
import { useSecurityEvidencePathDetailQuery } from "@/hooks/use-security-evidence-path-detail-query";

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

    renderPanel("finding-1");

    expect(screen.getByText(SECURENOW_PATH_INSPECT_PANEL_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-weakest-hop-callout")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-weakest-hop-row")).toBeInTheDocument();
    expect(screen.getAllByTestId("security-evidence-path-hop-provenance")[0]).toHaveTextContent("Observed fact");
    expect(screen.getAllByTestId("security-evidence-path-hop-provenance")[1]).toHaveTextContent("Derived fact");
    expect(screen.getAllByText("Possible").length).toBeGreaterThan(0);
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-cut-points")).toBeInTheDocument();
    expect(screen.getByTestId("security-evidence-path-routing")).toBeInTheDocument();
  });
});
