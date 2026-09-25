import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";

/** Workbook fixture ID for GOL / ICL al-ui-rate screenshots (local dev without API seed). */
export const WORKBOOK_INFRA_RESOURCE_HUB_DEMO_CLOUD_RESOURCE_ID =
  "11111111-1111-1111-1111-111111111111" as const;

const WORKBOOK_SNAPSHOT_ID = "22222222-2222-2222-2222-222222222222";
const WORKBOOK_ASSESSMENT_ID = "assessment-1";
const WORKBOOK_AUDIT_SNAPSHOT_ID = "snapshot-1";
const WORKBOOK_CONTROL_ID = "control-1";

const WORKBOOK_INFRA_RESOURCE_HUB_DEMO_RECORD: CloudResourceEvidenceHubResponse = {
  cloudResourceId: WORKBOOK_INFRA_RESOURCE_HUB_DEMO_CLOUD_RESOURCE_ID,
  externalResourceId:
    "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
  resourceType: "Microsoft.Network/publicIPAddresses",
  terraformAddress: "azurerm_public_ip.gateway",
  terraformGenerationMethod: "advisory",
  diagramCorrespondence: {
    correspondenceId: "corr-workbook-1",
    diagramNodeId: "node-gateway",
    diagramNodeLabel: "Gateway",
    cloudResourceId: WORKBOOK_INFRA_RESOURCE_HUB_DEMO_CLOUD_RESOURCE_ID,
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
  currentConfiguration: {
    snapshotId: WORKBOOK_SNAPSHOT_ID,
    azureResourceId:
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
    resourceType: "Microsoft.Network/publicIPAddresses",
    resourceGroup: "rg-net",
    region: "eastus",
    properties: { sku: "Standard" },
    tags: { environment: "workbook-demo" },
  },
  operationalSecurityFindings: {
    streamKind: "OperationalSecurity",
    streamLabel: "Operational security",
    items: [
      {
        id: "finding-workbook-1",
        title: "Public endpoint exposure",
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
    items: [{ instanceId: "instance-workbook-1", patternKey: "public-ip-restrict", status: "Draft" }],
    totalCount: 1,
    page: 1,
    pageSize: 25,
    hasMore: false,
  },
  rbacAssignments: [],
  networkRelationships: [],
  recentChanges: [
    {
      changeId: "change-workbook-1",
      diffId: "diff-workbook-1",
      snapshotAId: WORKBOOK_SNAPSHOT_ID,
      snapshotBId: "33333333-3333-3333-3333-333333333333",
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
    relativePath: `/v1/infra-evidence/audit-assessments/${WORKBOOK_ASSESSMENT_ID}/snapshots/${WORKBOOK_AUDIT_SNAPSHOT_ID}/controls/${WORKBOOK_CONTROL_ID}/lineage`,
    assessmentId: WORKBOOK_ASSESSMENT_ID,
    auditEvidenceSnapshotId: WORKBOOK_AUDIT_SNAPSHOT_ID,
    controlId: WORKBOOK_CONTROL_ID,
    controlNumber: "AC-2",
    controlTitle: "Account management",
    matches: [
      {
        assessmentId: WORKBOOK_ASSESSMENT_ID,
        auditEvidenceSnapshotId: WORKBOOK_AUDIT_SNAPSHOT_ID,
        controlId: WORKBOOK_CONTROL_ID,
        controlNumber: "AC-2",
        controlTitle: "Account management",
        snapshotCreatedUtc: "2026-01-15T12:00:00Z",
      },
    ],
  },
  evidencePointers: [],
};

export function tryWorkbookInfraResourceHubDemoFallback(
  cloudResourceId: string,
): CloudResourceEvidenceHubResponse | null {
  if (cloudResourceId.trim() === WORKBOOK_INFRA_RESOURCE_HUB_DEMO_CLOUD_RESOURCE_ID) {
    return WORKBOOK_INFRA_RESOURCE_HUB_DEMO_RECORD;
  }

  return null;
}
