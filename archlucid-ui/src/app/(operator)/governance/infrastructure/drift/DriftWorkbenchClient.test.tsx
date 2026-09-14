import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { DriftWorkbenchClient } from "@/app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient";

let searchParams = new URLSearchParams(
  "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222",
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/governance/infrastructure/drift",
  useSearchParams: () => searchParams,
}));

const mockFetchDiffs = vi.fn(async () => [
  {
    diffId: "diff-1",
    snapshotAId: "11111111-1111-1111-1111-111111111111",
    snapshotBId: "33333333-3333-3333-3333-333333333333",
    totalChanges: 1,
    createdUtc: "2026-09-01T12:00:00Z",
  },
]);

const mockFetchChanges = vi.fn(async () => ({
  items: [
    {
      changeId: "change-1",
      diffId: "diff-1",
      cloudResourceId: "22222222-2222-2222-2222-222222222222",
      azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
      changeType: "Modified",
      property: "sku",
      oldValue: "Basic",
      newValue: "Standard",
      riskClassification: "Medium",
      evidenceReference: "snapshot-diff",
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 100,
  hasMore: false,
}));

const { downloadInfraEvidenceTerraformAdvisoryZipMock } = vi.hoisted(() => ({
  downloadInfraEvidenceTerraformAdvisoryZipMock: vi.fn(async () => undefined),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [
      {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        subscriptionId: "sub-1",
        subscriptionName: "Prod",
        capturedUtc: "2026-09-01T12:00:00Z",
        captureStatus: 1,
        resourceCount: 42,
        relationshipCount: 10,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  })),
  fetchInfraEvidenceDiffsForSnapshot: (...args: unknown[]) => mockFetchDiffs(...args),
  fetchInfraEvidenceDiffChanges: (...args: unknown[]) => mockFetchChanges(...args),
  downloadInfraEvidenceTerraformAdvisoryZip: downloadInfraEvidenceTerraformAdvisoryZipMock,
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Drift",
      useWhen: "Compare snapshots",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

const evalChrome = { enabled: true };

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => evalChrome.enabled,
}));

describe("DriftWorkbenchClient", () => {
  beforeEach(() => {
    evalChrome.enabled = true;
    mockFetchDiffs.mockClear();
    mockFetchChanges.mockClear();
    downloadInfraEvidenceTerraformAdvisoryZipMock.mockReset();
    downloadInfraEvidenceTerraformAdvisoryZipMock.mockResolvedValue(undefined);
  });

  it("renders snapshot table and export button after selecting a snapshot", async () => {
    searchParams = new URLSearchParams();
    render(<DriftWorkbenchClient />);

    expect(await screen.findByRole("table", { name: "Inventory snapshots" })).toBeInTheDocument();
    expect(screen.queryByTestId("infra-drift-export-terraform")).not.toBeInTheDocument();

    fireEvent.click(await screen.findByTestId("infra-drift-snapshot-row-11111111-1111-1111-1111-111111111111"));

    expect(await screen.findByTestId("infra-drift-export-terraform")).not.toBeDisabled();
    expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
  });

  it("does not load drift changes until a diff is selected", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-diff-picker")).toBeInTheDocument();
    });

    expect(mockFetchChanges).not.toHaveBeenCalled();
    expect(screen.getByTestId("infra-drift-changes-empty-unselected")).toBeInTheDocument();
  });

  it("shows resource scope banner when cloudResourceId is in the URL", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-resource-scope-banner")).toHaveTextContent("Scoped to resource.");
    expect(screen.getByTestId("infra-drift-resource-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-open-primary-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=drift&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("link", { name: "View drift in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-open-terraform-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=terraform&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-drift-open-findings-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=findings&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-drift-open-remediation-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=remediation&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-drift-open-diagram-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=diagram&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    await waitFor(() => {
      expect(mockFetchChanges).toHaveBeenCalledWith("diff-1", 1, 100, {
        cloudResourceId: "22222222-2222-2222-2222-222222222222",
      });
    });
  });

  it("shows audit hub cross-link when audit scope params are in the URL", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-open-audit-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/22222222-2222-2222-2222-222222222222?tab=audit&snapshotId=11111111-1111-1111-1111-111111111111&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("opens change detail when changeId is deep-linked", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&changeId=change-1&cloudResourceId=22222222-2222-2222-2222-222222222222",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-change-drawer")).toBeInTheDocument();
    const changeRow = screen.getByTestId("infra-drift-change-row-change-1");
    const detailRow = screen.getByTestId("infra-drift-change-detail-row-change-1");
    expect(changeRow).toHaveAttribute("aria-selected", "true");
    expect(changeRow.nextElementSibling).toBe(detailRow);
    expect(screen.getByTestId("infra-drift-change-drawer")).toHaveTextContent("gw");
    expect(screen.getByTestId("infra-drift-change-identifiers")).toBeInTheDocument();
  });

  it("links Ask with diff and resource scope when a diff is selected", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
    render(<DriftWorkbenchClient />);

    const askLink = await screen.findByTestId("infra-drift-open-ask");
    expect(askLink).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&tab=drift",
    );
  });

  it("forwards audit scope in Ask when audit params are in the URL", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=22222222-2222-2222-2222-222222222222&diffId=diff-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<DriftWorkbenchClient />);

    const askLink = await screen.findByTestId("infra-drift-open-ask");
    expect(askLink).toHaveAttribute(
      "href",
      "/governance/infrastructure/ask?cloudResourceId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc&tab=drift",
    );
  });

  it("shows missing deep-link copy when changeId is absent from the diff", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&changeId=missing-change",
    );
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-change-deep-link-missing")).toHaveTextContent(
      "linked drift change is not in the selected diff",
    );
  });

  it("renders resource names instead of repeating ARM prefixes", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    const row = await screen.findByTestId("infra-drift-change-row-change-1");
    expect(row).toHaveTextContent("gw");
    expect(row).toHaveTextContent("rg");
    expect(row).toHaveTextContent("publicIPAddresses");
    expect(row).not.toHaveTextContent("/subscriptions/");
    expect(screen.getByTestId("infra-drift-sort-resourceGroup")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-resourceType")).toBeInTheDocument();
  });

  it("renders a discrete drift change table with sortable headers (IE-DT-02)", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByRole("table", { name: "Inventory drift changes" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-resource")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-resourceGroup")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-resourceType")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-change")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-property")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-risk")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-resource-filter-trigger")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-changes-body")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-drift-change-row-change-1")).toBeInTheDocument();
  });

  it("renders risk as text labels instead of severity chips", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    const row = await screen.findByTestId("infra-drift-change-row-change-1");

    expect(row.querySelector('[data-testid="infra-drift-risk-label"]')).toHaveTextContent("Medium");
    expect(row.querySelector('[data-severity-tag]')).not.toBeInTheDocument();
  });

  it("hides resource-removed rows when the selected diff does not compare two inventories", async () => {
    mockFetchDiffs.mockResolvedValueOnce([
      {
        diffId: "diff-same",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "11111111-1111-1111-1111-111111111111",
        totalChanges: 2,
        createdUtc: "2026-09-01T12:00:00Z",
      },
    ]);
    mockFetchChanges.mockResolvedValueOnce({
      items: [
        {
          changeId: "change-removed",
          diffId: "diff-same",
          cloudResourceId: "22222222-2222-2222-2222-222222222222",
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/removed-vm",
          changeType: "ResourceRemoved",
          property: null,
          oldValue: null,
          newValue: null,
          riskClassification: null,
          evidenceReference: "snapshot-diff",
        },
        {
          changeId: "change-modified",
          diffId: "diff-same",
          cloudResourceId: "33333333-3333-3333-3333-333333333333",
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/active-vm",
          changeType: "ResourceModified",
          property: "sku",
          oldValue: "Basic",
          newValue: "Standard",
          riskClassification: "none",
          evidenceReference: "snapshot-diff",
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-same");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-change-row-change-modified")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("infra-drift-change-row-change-removed")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-changes-body").querySelectorAll("tr")).toHaveLength(1);
  });

  it("renders one row per drift change when multiple changes are returned (IE-DT-02)", async () => {
    mockFetchChanges.mockResolvedValueOnce({
      items: [
        {
          changeId: "change-1",
          diffId: "diff-1",
          cloudResourceId: "22222222-2222-2222-2222-222222222222",
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg-a/providers/Microsoft.Network/publicIPAddresses/gw-a",
          changeType: "Modified",
          property: "sku",
          oldValue: "Basic",
          newValue: "Standard",
          riskClassification: "Medium",
          evidenceReference: "snapshot-diff",
        },
        {
          changeId: "change-2",
          diffId: "diff-1",
          cloudResourceId: "33333333-3333-3333-3333-333333333333",
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg-b/providers/Microsoft.Storage/storageAccounts/logs",
          changeType: "Added",
          property: "tags",
          oldValue: null,
          newValue: "env=prod",
          riskClassification: null,
          evidenceReference: "snapshot-diff",
        },
        {
          changeId: "change-3",
          diffId: "diff-1",
          cloudResourceId: "44444444-4444-4444-4444-444444444444",
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg-c/providers/Microsoft.Compute/virtualMachines/app-01",
          changeType: "ResourceRemoved",
          property: "size",
          oldValue: "Standard_D2s_v3",
          newValue: null,
          riskClassification: "High",
          evidenceReference: "snapshot-diff",
        },
      ],
      totalCount: 3,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-change-row-change-1")).toBeInTheDocument();
      expect(screen.getByTestId("infra-drift-change-row-change-2")).toBeInTheDocument();
      expect(screen.getByTestId("infra-drift-change-row-change-3")).toBeInTheDocument();
    });

    expect(screen.getByTestId("infra-drift-changes-body").querySelectorAll("tr")).toHaveLength(3);
  });

  it("keeps snapshot ids behind disclosure and uses human snapshot labels", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
    });
    expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).not.toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-drift-snapshot-identifiers")).toBeInTheDocument();
    expect(await screen.findByTestId("infra-drift-scope-freshness")).toHaveTextContent("Prod");
    expect(screen.getByTestId("infra-drift-scope-freshness")).not.toHaveTextContent(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-drift-scope-freshness")).not.toHaveTextContent("diff-1");
  });

  it("collapses advanced-operations guidance behind a summary", async () => {
    evalChrome.enabled = false;
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("layer-header-collapsible-guidance")).toBeInTheDocument();
    expect(screen.getByText("How drift compare works")).toBeInTheDocument();
  });

  it("shows an inline error instead of a toast when Terraform export fails", async () => {
    downloadInfraEvidenceTerraformAdvisoryZipMock.mockRejectedValueOnce(
      new Error("Request validation failed (HTTP 400): Export unavailable in this environment."),
    );

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    fireEvent.click(await screen.findByTestId("infra-drift-export-terraform"));

    expect(await screen.findByTestId("infra-drift-export-error")).toHaveTextContent(
      "Could not download Terraform advisory export",
    );
    expect(screen.getByTestId("infra-drift-export-error")).toHaveTextContent(
      "Export unavailable in this environment.",
    );
  });
});
