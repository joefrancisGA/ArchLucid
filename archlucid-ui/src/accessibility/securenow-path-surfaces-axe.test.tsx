import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";
import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";

expect.extend(toHaveNoViolations);

const {
  fetchSecurityEvidencePathDetailMock,
  fetchInfraEvidenceSnapshotsMock,
  fetchInfraEvidenceMermaidRenderMock,
} = vi.hoisted(() => ({
  fetchSecurityEvidencePathDetailMock: vi.fn(),
  fetchInfraEvidenceSnapshotsMock: vi.fn(),
  fetchInfraEvidenceMermaidRenderMock: vi.fn(),
}));

let searchParams = new URLSearchParams();
let pathname = "/governance/infrastructure/diagrams";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-operational-security-finding-detail-query", () => ({
  useOperationalSecurityFindingDetailQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/hooks/use-agent-execution-mode", () => ({
  useAgentExecutionMode: vi.fn(() => ({
    mode: "Simulator",
    isSimulator: true,
    isLoading: false,
  })),
}));

vi.mock("@/hooks/use-security-evidence-path-detail-query", () => ({
  useSecurityEvidencePathDetailQuery: vi.fn(() => ({
    data: {
      pathId: "path-1",
      snapshotId: "11111111-1111-1111-1111-111111111111",
      pathKind: "PrivilegePath",
      pathConfidenceBand: "HighlyLikely",
      weakestHopOrdinal: 1,
      weakestHopReason: "Gap",
      hops: [
        {
          hopOrdinal: 1,
          fromNodeLabel: "vm-a",
          toNodeLabel: "vm-b",
          edgeType: "Allows",
          provenanceKind: "ObservedFact",
          hopConfidenceBand: "High",
          inferenceSource: null,
          evidenceReference: "hop:1",
          cloudResourceId: null,
        },
      ],
      weakestHop: null,
      explanationTemplate: {
        actor: null,
        identity: null,
        network: null,
        asset: null,
        weakControl: null,
        proposedChange: "",
        verify: "",
        architectSentence: "Fixture architect sentence.",
      },
      relatedCutPoints: [
        {
          cutPointId: "cut-1",
          label: "Remove standing assignment",
          frameworkTheme: "Least privilege",
          explanationSummary: "Remove the standing assignment.",
        },
      ],
      routing: [],
    },
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/hooks/use-security-evidence-path-rank-query", () => ({
  useSecurityEvidencePathRankQuery: vi.fn(() => ({
    data: {
      pathId: "path-1",
      snapshotId: "11111111-1111-1111-1111-111111111111",
      rankOrder: 1,
      ruleVersion: "SA-09-v1",
      technicalExposureScore: 0.8,
      privilegeDepthScore: 0.6,
      blastRadiusScore: 0.7,
      businessConsequenceScore: null,
      confidenceBandScore: 0.5,
      compositeSortScore: 0.7123,
      explanationSummary: "Fixture rank reason.",
      breakdownJson: "[]",
      pathKind: "PrivilegePath",
      pathConfidenceBand: "HighlyLikely",
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
  })),
}));

vi.mock("@/lib/security-evidence-path-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/security-evidence-path-api")>();

  return {
    ...actual,
    buildSecurityEvidencePathExplanation: vi.fn(),
    fetchSecurityEvidencePathDetail: fetchSecurityEvidencePathDetailMock,
  };
});

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => []),
}));

vi.mock("@/hooks/use-tenant-branding-presentation-query", () => ({
  useTenantBrandingPresentationQuery: () => ({ data: null }),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/use-iana-time-zone-preference", () => ({
  useIanaTimeZonePreference: () => ({
    ianaTimeZoneId: "America/New_York",
    mounted: true,
    accountSyncState: "idle",
    setAndPersist: vi.fn(),
  }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: fetchInfraEvidenceSnapshotsMock,
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-mermaid-api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/infra-evidence/infra-evidence-mermaid-api")>();

  return {
    ...actual,
    fetchInfraEvidenceMermaidPreview: vi.fn(),
    fetchInfraEvidenceMermaidRender: fetchInfraEvidenceMermaidRenderMock,
    downloadInfraEvidenceMermaidPng: vi.fn(),
    formatInfraEvidenceMermaidApiError: (error: unknown) => String(error),
  };
});

vi.mock("@/components/architecture/ArchitectureDiagramViewer", () => ({
  ArchitectureDiagramViewer: () => <div data-testid="architecture-diagram-viewer-mock" />,
}));

vi.mock("@/components/infra-evidence/SecureNowQuestionQueue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/infra-evidence/SecureNowQuestionQueue")>();

  return {
    ...actual,
    SecureNowQuestionQueue: () => null,
  };
});

describe("SecureNow path surfaces — axe", () => {
  beforeEach(() => {
    fetchInfraEvidenceSnapshotsMock.mockResolvedValue([
      {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        capturedOnUtc: "2026-01-01T00:00:00.000Z",
        subscriptionId: "sub-1",
        subscriptionDisplayName: "Fixture subscription",
        resourceCount: 3,
      },
    ]);
    fetchInfraEvidenceMermaidRenderMock.mockResolvedValue({
      snapshotId: "11111111-1111-1111-1111-111111111111",
      mode: "executive",
      fallbackKey: null,
      status: "Succeeded",
      mermaid: "flowchart LR\n  nodea[vm-a] --> nodeb[vm-b]",
      metrics: {
        nodeCount: 2,
        edgeCount: 1,
        subgraphCount: 0,
        maxDegree: 1,
        crossSubgraphEdgeCount: 0,
        textSizeBytes: 80,
        layoutEstimate: 40,
      },
      fallbackArtifacts: [],
    });
    fetchSecurityEvidencePathDetailMock.mockResolvedValue({
      pathId: "path-1",
      snapshotId: "11111111-1111-1111-1111-111111111111",
      hops: [
        {
          hopOrdinal: 1,
          fromNodeLabel: "vm-a",
          toNodeLabel: "vm-b",
          edgeType: "Allows",
          provenanceKind: "ObservedFact",
          hopConfidenceBand: "High",
          inferenceSource: null,
          evidenceReference: "hop:1",
          cloudResourceId: null,
        },
      ],
      routing: [],
      weakestHop: null,
      relatedCutPoints: [],
    });
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&mermaidMode=executive&pathId=path-1",
    );
  });

  it("has no serious axe violations on Path inspect with one path loaded", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SecurityEvidencePathInspectPanel findingId={null} pathIdOverride="path-1" />
      </QueryClientProvider>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no serious axe violations on the path-scoped diagram surface", async () => {
    const { container } = render(<DiagramsWorkbenchClient />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
