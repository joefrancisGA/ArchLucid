import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResourceHubClient } from "@/app/(operator)/governance/infrastructure/resources/[cloudResourceId]/ResourceHubClient";

const replace = vi.fn();
let searchParams = new URLSearchParams("tab=overview&snapshotId=22222222-2222-2222-2222-222222222222");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111",
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  fetchCloudResourceEvidenceHub: vi.fn(async () => ({
    cloudResourceId: "11111111-1111-1111-1111-111111111111",
    externalResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    currentConfiguration: {
      snapshotId: "22222222-2222-2222-2222-222222222222",
      azureResourceId:
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      region: "eastus",
      properties: {},
      tags: {},
    },
    terraformAddress: "azurerm_public_ip.gateway",
    terraformGenerationMethod: "advisory",
    diagramCorrespondence: null,
    operationalSecurityFindings: {
      streamKind: "OperationalSecurity",
      streamLabel: "Operational security",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      hasMore: false,
    },
    architectureReviewFindings: {
      streamKind: "ArchitectureReview",
      streamLabel: "Architecture review",
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 25,
      hasMore: false,
    },
    remediationInstances: { items: [], totalCount: 0, page: 1, pageSize: 25, hasMore: false },
    rbacAssignments: [],
    networkRelationships: [],
    recentChanges: [],
    auditLineageLink: {
      available: true,
      degradedReason: null,
      relativePath: "/v1/infra-evidence/audit-assessments/a/snapshots/s/controls/c/lineage",
      assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      controlNumber: "AC-2",
      controlTitle: "Account management",
      matches: [
        {
          assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
          controlNumber: "AC-2",
          controlTitle: "Account management",
          snapshotCreatedUtc: "2026-01-01T00:00:00Z",
        },
      ],
    },
    evidencePointers: [],
  })),
  formatInfraEvidenceHubApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Resource hub",
      useWhen: "Inspect evidence",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

describe("ResourceHubClient", () => {
  it("renders overview ask link with resource and snapshot context", async () => {
    searchParams = new URLSearchParams("tab=overview&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-open-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("renders audit lineage link when audit tab is active", async () => {
    searchParams = new URLSearchParams("tab=audit");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-audit-lineage-link")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-audit-degraded")).not.toBeInTheDocument();
  });
});
