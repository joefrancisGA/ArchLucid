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
      items: [
        {
          id: "finding-1",
          title: "Public endpoint",
          severity: "High",
          status: "Open",
          streamKind: "OperationalSecurity",
          streamLabel: "Operational security",
        },
      ],
      totalCount: 1,
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
    remediationInstances: {
      items: [
        {
          instanceId: "instance-1",
          patternKey: "public-ip-restrict",
          status: "Draft",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 25,
      hasMore: false,
    },
    rbacAssignments: [],
    networkRelationships: [],
    recentChanges: [
      {
        changeId: "change-1",
        diffId: "diff-1",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "22222222-2222-2222-2222-222222222222",
        property: "sku",
        changeType: "Modified",
        oldValue: "Basic",
        newValue: "Standard",
        riskClassification: "Medium",
      },
    ],
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
    expect(screen.getByTestId("infra-resource-hub-open-remediation-work")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("renders audit lineage link when audit tab is active", async () => {
    searchParams = new URLSearchParams("tab=audit");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-audit-lineage-link")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-audit-degraded")).not.toBeInTheDocument();
  });

  it("shows tab count badges for findings and drift", async () => {
    searchParams = new URLSearchParams("tab=overview");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-tab-findings")).toHaveTextContent("Findings (1)");
    expect(screen.getByTestId("infra-resource-hub-tab-drift")).toHaveTextContent("Drift (1)");
  });

  it("links drift rows to the scoped drift workbench", async () => {
    searchParams = new URLSearchParams("tab=overview&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-drift-change-change-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&changeId=change-1&diffId=diff-1",
    );
  });

  it("links drift rows to scoped Infrastructure Ask with diff context", async () => {
    searchParams = new URLSearchParams("tab=overview&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-drift-ask-change-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
  });

  it("links drift tab rows to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=drift&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-drift-tab-ask-change-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
  });

  it("links findings rows into the scoped remediation factory", async () => {
    searchParams = new URLSearchParams("tab=findings");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-finding-factory-finding-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=finding-1",
    );
  });

  it("links findings rows to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=findings&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-finding-ask-finding-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&findingId=finding-1",
    );
  });

  it("links remediation rows into the scoped factory with instance id", async () => {
    searchParams = new URLSearchParams("tab=remediation");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-remediation-factory-instance-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&instanceId=instance-1",
    );
  });
});
