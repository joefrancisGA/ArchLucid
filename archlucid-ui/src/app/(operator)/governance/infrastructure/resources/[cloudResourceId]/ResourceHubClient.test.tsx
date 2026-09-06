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
    diagramCorrespondence: {
      correspondenceId: "corr-1",
      diagramNodeId: "node-1",
      diagramNodeLabel: "Gateway",
      cloudResourceId: "11111111-1111-1111-1111-111111111111",
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
      totalCount: 1,
      page: 1,
      pageSize: 25,
      hasMore: false,
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
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-open-drift-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-open-remediation-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-open-diagrams-work")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood&seedNodeId=%2Fsubscriptions%2Fsub%2FresourceGroups%2Frg-net%2Fproviders%2FMicrosoft.Network%2FpublicIPAddresses%2Fgateway",
    );
    expect(screen.getByTestId("infra-resource-hub-open-diagram-reconcile-work")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagram-reconcile?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-resource-hub-open-diagram-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=diagram&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-open-terraform-work")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-open-audit-work")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("preserves runId on overview diagram tab quick link", async () => {
    searchParams = new URLSearchParams(
      "tab=overview&snapshotId=22222222-2222-2222-2222-222222222222&runId=run-1",
    );
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-open-diagram-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=diagram&runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("renders audit lineage link when audit tab is active", async () => {
    searchParams = new URLSearchParams("tab=audit");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-audit-lineage-link")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-audit-degraded")).not.toBeInTheDocument();
  });

  it("links audit lineage to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=audit&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-audit-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByTestId("infra-resource-hub-audit-open-overview-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-audit-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("links diagram tab to scoped diagram reconcile workbench", async () => {
    searchParams = new URLSearchParams("tab=diagram&snapshotId=22222222-2222-2222-2222-222222222222&runId=run-1");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-diagram-reconcile-workbench")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-open-overview-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-open-drift-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-open-remediation-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-open-terraform-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("links diagram tab to scoped inventory diagrams workbench", async () => {
    searchParams = new URLSearchParams("tab=diagram&snapshotId=22222222-2222-2222-2222-222222222222&runId=run-1");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-diagrams-workbench")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood&seedNodeId=%2Fsubscriptions%2Fsub%2FresourceGroups%2Frg-net%2Fproviders%2FMicrosoft.Network%2FpublicIPAddresses%2Fgateway",
    );
  });

  it("links diagram correspondence to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=diagram&snapshotId=22222222-2222-2222-2222-222222222222&runId=run-1");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-diagram-reconcile")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&correspondenceId=corr-1",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-ask")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&correspondenceId=corr-1&runId=run-1",
    );
    expect(screen.getByTestId("infra-resource-hub-diagram-remediation")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&correspondenceId=corr-1&runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("shows tab count badges for findings and drift", async () => {
    searchParams = new URLSearchParams("tab=overview");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-tab-findings")).toHaveTextContent("Findings (2)");
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
    expect(screen.getByTestId("infra-resource-hub-drift-open-overview-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-drift-open-terraform")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-drift-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-drift-open-remediation-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("links findings rows into the scoped remediation factory", async () => {
    searchParams = new URLSearchParams("tab=findings");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-findings-open-remediation-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-findings-open-overview-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-findings-open-drift-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-findings-open-audit-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByTestId("infra-resource-hub-findings-open-terraform-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-finding-factory-finding-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=finding-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("links findings rows to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=findings&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-findings-open-remediation-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-finding-ask-finding-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&findingId=finding-1",
    );
  });

  it("links remediation rows into the scoped factory with instance id", async () => {
    searchParams = new URLSearchParams("tab=remediation");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-remediation-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-remediation-open-overview-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-remediation-open-diagram-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=diagram&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-remediation-open-drift-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-remediation-open-terraform-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-remediation-factory-instance-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&instanceId=instance-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("links remediation rows to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-remediation-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-remediation-ask-instance-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&instanceId=instance-1",
    );
  });

  it("links architecture review findings to scoped Infrastructure Ask", async () => {
    searchParams = new URLSearchParams("tab=findings&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-architecture-finding-ask-arch-finding-1")).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&findingId=arch-finding-1",
    );
  });

  it("links terraform tab export to scoped drift workbench", async () => {
    searchParams = new URLSearchParams("tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222");
    render(<ResourceHubClient cloudResourceId="11111111-1111-1111-1111-111111111111" />);

    expect(await screen.findByTestId("infra-resource-hub-terraform-drift-export")).toHaveAttribute(
      "href",
      "/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-resource-hub-terraform-open-overview-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-terraform-open-drift-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-terraform-open-findings-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-terraform-open-remediation-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-resource-hub-terraform-open-diagram-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=diagram&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByText("azurerm_public_ip.gateway")).toBeInTheDocument();
  });
});
