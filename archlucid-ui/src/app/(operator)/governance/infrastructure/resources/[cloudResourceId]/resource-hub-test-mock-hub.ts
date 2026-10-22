import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

export const RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID = "11111111-1111-1111-1111-111111111111";
export const RESOURCE_HUB_TEST_SNAPSHOT_ID = "22222222-2222-2222-2222-222222222222";

export const RESOURCE_HUB_TEST_AUDIT_SUFFIX =
  "&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc";

export function buildResourceHubTestMockHub(
  overrides: Partial<CloudResourceEvidenceHubResponse> = {},
): CloudResourceEvidenceHubResponse {
  return {
    cloudResourceId: RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
    externalResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    currentConfiguration: {
      snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID,
      azureResourceId:
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      region: "eastus",
      properties: { sku: "Standard" },
      tags: { env: "prod" },
    },
    terraformAddress: "azurerm_public_ip.gateway",
    terraformGenerationMethod: "advisory",
    diagramCorrespondence: {
      correspondenceId: "corr-1",
      diagramNodeId: "node-1",
      diagramNodeLabel: "Gateway",
      cloudResourceId: RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
      azureResourceId:
        "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      resourceType: "Microsoft.Network/publicIPAddresses",
      resourceGroup: "rg-net",
      terraformAddress: "azurerm_public_ip.gateway",
      matchKind: "Conflict",
      confidenceBand: "Likely",
      explainText: "Diagram node conflicts with inventory public IP configuration.",
      aiRationale: null,
      securityDiscrepancy: true,
    },
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
      totalCount: 40,
      page: 1,
      pageSize: 25,
      hasMore: true,
    },
    architectureReviewFindings: {
      streamKind: "ArchitectureReview",
      streamLabel: "Architecture review",
      items: [
        {
          id: "arch-finding-1",
          title: "Missing subnet segmentation",
          severity: "Medium",
          status: "Open",
          streamKind: "ArchitectureReview",
          streamLabel: "Architecture review",
        },
      ],
      totalCount: 1,
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
      totalCount: 50,
      page: 1,
      pageSize: 25,
      hasMore: true,
    },
    rbacAssignments: [
      {
        principalId: "principal-1",
        roleDefinitionId: "role-reader",
        scope: "/subscriptions/sub",
      },
    ],
    networkRelationships: [
      {
        relationshipType: "Peering",
        fromAzureResourceId: "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-a",
        toAzureResourceId: "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-b",
      },
    ],
    recentChanges: [
      {
        changeId: "change-1",
        diffId: "diff-1",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: RESOURCE_HUB_TEST_SNAPSHOT_ID,
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
    evidencePointers: [{ kind: "inventory", relativePath: "snapshots/222/properties.json" }],
    ...overrides,
  };
}
