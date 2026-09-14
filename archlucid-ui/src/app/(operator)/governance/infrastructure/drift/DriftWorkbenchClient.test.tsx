import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
      changedByDisplayName: "operator@contoso.com",
      changedByKind: "human",
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 100,
  hasMore: false,
}));

const { downloadInfraEvidenceTerraformAdvisoryZipMock, mockSnapshotItems } = vi.hoisted(() => ({
  downloadInfraEvidenceTerraformAdvisoryZipMock: vi.fn(async () => undefined),
  mockSnapshotItems: [
    {
      snapshotId: "11111111-1111-1111-1111-111111111111",
      subscriptionId: "sub-1",
      subscriptionName: "Prod",
      capturedUtc: "2026-09-01T12:00:00Z",
      captureStatus: 1,
      resourceCount: 42,
      relationshipCount: 10,
    },
    {
      snapshotId: "33333333-3333-3333-3333-333333333333",
      subscriptionId: "sub-2",
      subscriptionName: "Dev",
      capturedUtc: "2026-09-15T12:00:00Z",
      captureStatus: 1,
      resourceCount: 18,
      relationshipCount: 4,
    },
  ],
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: mockSnapshotItems,
    totalCount: mockSnapshotItems.length,
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

const defaultMockDiffs = () => [
  {
    diffId: "diff-1",
    snapshotAId: "11111111-1111-1111-1111-111111111111",
    snapshotBId: "33333333-3333-3333-3333-333333333333",
    totalChanges: 1,
    createdUtc: "2026-09-16T12:00:00Z",
  },
];

const defaultMockChanges = () => ({
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
      changedByDisplayName: "operator@contoso.com",
      changedByKind: "human",
    },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 100,
  hasMore: false,
});

describe("DriftWorkbenchClient", () => {
  beforeEach(() => {
    evalChrome.enabled = true;
    mockFetchDiffs.mockReset();
    mockFetchDiffs.mockImplementation(async () => defaultMockDiffs());
    mockFetchChanges.mockReset();
    mockFetchChanges.mockImplementation(async () => defaultMockChanges());
    downloadInfraEvidenceTerraformAdvisoryZipMock.mockReset();
    downloadInfraEvidenceTerraformAdvisoryZipMock.mockResolvedValue(undefined);
    mockSnapshotItems.splice(
      0,
      mockSnapshotItems.length,
      {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        subscriptionId: "sub-1",
        subscriptionName: "Prod",
        capturedUtc: "2026-09-01T12:00:00Z",
        captureStatus: 1,
        resourceCount: 42,
        relationshipCount: 10,
      },
      {
        snapshotId: "33333333-3333-3333-3333-333333333333",
        subscriptionId: "sub-2",
        subscriptionName: "Dev",
        capturedUtc: "2026-09-15T12:00:00Z",
        captureStatus: 1,
        resourceCount: 18,
        relationshipCount: 4,
      },
    );
  });

  it("does not select an inventory file on landing and shows picker placeholder", async () => {
    searchParams = new URLSearchParams();
    render(<DriftWorkbenchClient />);

    const snapshotPicker = await screen.findByTestId("infra-drift-snapshot-picker");
    expect(snapshotPicker).toHaveValue("");
    expect(within(snapshotPicker).getByRole("option", { name: "Select an inventory…" })).toBeInTheDocument();
    expect(screen.queryByTestId("infra-drift-export-terraform")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-drift-diff-picker")).not.toBeInTheDocument();
  });

  it("renders snapshot table and export button after selecting an inventory file", async () => {
    searchParams = new URLSearchParams();
    render(<DriftWorkbenchClient />);

    expect(await screen.findByRole("table", { name: "Inventory snapshots" })).toBeInTheDocument();
    const snapshotPicker = await screen.findByTestId("infra-drift-snapshot-picker");
    fireEvent.change(snapshotPicker, {
      target: { value: "11111111-1111-1111-1111-111111111111" },
    });

    expect(await screen.findByTestId("infra-drift-export-terraform")).not.toBeDisabled();
    expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
    expect(snapshotPicker).toHaveValue("11111111-1111-1111-1111-111111111111");
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

  it("restores anchor snapshot and empty changes when diff selection is cleared", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    const diffPicker = await screen.findByTestId("infra-drift-diff-picker");
    fireEvent.change(diffPicker, { target: { value: "diff-1" } });
    fireEvent.click(await screen.findByTestId("infra-drift-cross-subscription-confirm"));

    await waitFor(() => {
      expect(mockFetchChanges).toHaveBeenCalledWith("diff-1", 1, 100, {
        cloudResourceId: null,
        includeUnchanged: false,
      });
    });
    expect(screen.getByTestId("infra-drift-change-row-change-1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("infra-drift-snapshot-row-33333333-3333-3333-3333-333333333333"));
    expect(await screen.findByTestId("infra-drift-cross-subscription-dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("infra-drift-cross-subscription-cancel"));

    fireEvent.change(diffPicker, { target: { value: "" } });

    await waitFor(() => {
      expect(diffPicker).toHaveValue("");
    });
    expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
    expect(screen.getByTestId("infra-drift-snapshot-selected-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-snapshot-row-33333333-3333-3333-3333-333333333333")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-changes-empty-unselected")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-drift-change-row-change-1")).not.toBeInTheDocument();
  });

  it("only lists diffs whose comparison snapshot was captured after the anchor inventory", async () => {
    mockFetchDiffs.mockResolvedValueOnce([
      {
        diffId: "diff-later",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "33333333-3333-3333-3333-333333333333",
        totalChanges: 2,
        createdUtc: "2026-09-16T12:00:00Z",
      },
      {
        diffId: "diff-earlier",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "22222222-2222-2222-2222-222222222222",
        totalChanges: 1,
        createdUtc: "2026-08-01T12:00:00Z",
      },
    ]);
    mockSnapshotItems.push({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      subscriptionId: "sub-1",
      subscriptionName: "Prod older",
      capturedUtc: "2026-08-01T12:00:00Z",
      captureStatus: 1,
      resourceCount: 30,
      relationshipCount: 8,
    });

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    const diffPicker = await screen.findByTestId("infra-drift-diff-picker");
    await waitFor(() => {
      expect(within(diffPicker).getByRole("option", { name: /2 changes vs/i })).toBeInTheDocument();
    });

    expect(within(diffPicker).queryByRole("option", { name: /1 changes vs/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-drift-diffs-empty-later-than-anchor")).not.toBeInTheDocument();
  });

  it("shows later-than-anchor empty state when only older diffs exist", async () => {
    mockFetchDiffs.mockResolvedValueOnce([
      {
        diffId: "diff-earlier",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "22222222-2222-2222-2222-222222222222",
        totalChanges: 1,
        createdUtc: "2026-08-01T12:00:00Z",
      },
    ]);
    mockSnapshotItems.push({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      subscriptionId: "sub-1",
      subscriptionName: "Prod older",
      capturedUtc: "2026-08-01T12:00:00Z",
      captureStatus: 1,
      resourceCount: 30,
      relationshipCount: 8,
    });

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-diffs-empty-later-than-anchor")).toHaveTextContent(
      "No later inventory captures to compare",
    );
    expect(screen.getByTestId("infra-drift-diff-picker")).toBeDisabled();
  });

  it("does not re-select a diff after the user clears while diffs are still loading", async () => {
    let resolveDiffs: ((value: unknown) => void) | undefined;
    mockFetchDiffs.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDiffs = resolve;
        }),
    );

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1",
    );
    render(<DriftWorkbenchClient />);

    const diffPicker = await screen.findByTestId("infra-drift-diff-picker");
    fireEvent.change(diffPicker, { target: { value: "" } });

    await waitFor(() => {
      expect(diffPicker).toHaveValue("");
    });

    resolveDiffs?.([
      {
        diffId: "diff-1",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "33333333-3333-3333-3333-333333333333",
        totalChanges: 1,
        createdUtc: "2026-09-01T12:00:00Z",
      },
    ]);

    await waitFor(() => {
      expect(mockFetchDiffs).toHaveBeenCalled();
    });
    expect(diffPicker).toHaveValue("");
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
        includeUnchanged: false,
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
    expect(screen.getByTestId("infra-drift-change-changed-by")).toHaveTextContent("operator@contoso.com");
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

  it("excludes same-snapshot diffs from the picker because they are not later captures", async () => {
    mockFetchDiffs.mockImplementationOnce(async () => [
      {
        diffId: "diff-same",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "11111111-1111-1111-1111-111111111111",
        totalChanges: 2,
        createdUtc: "2026-09-01T12:00:00Z",
      },
    ]);

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-diffs-empty-later-than-anchor")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-diff-picker")).toBeDisabled();
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
    expect(screen.queryByTestId("infra-drift-scope-freshness")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-sort-subscription")).toBeInTheDocument();
  });

  it("renders contextual help trigger with the page title beside the help icon", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("page-contextual-help-button")).toHaveTextContent("Drift & snapshots");
    expect(screen.getByTestId("page-contextual-help-button")).toHaveAccessibleName("Help: Drift & snapshots");
  });

  it("renders drift guidance under the page headline without advanced-operations chrome", async () => {
    evalChrome.enabled = false;
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-page-lead")).toHaveTextContent(
      "Compare inventory snapshots and classify drift.",
    );
    expect(screen.getByTestId("infra-drift-page-lead")).toHaveTextContent(
      "Pick current and baseline snapshots before exporting advisory Terraform.",
    );
    expect(screen.getByTestId("infra-drift-page-secondary-lead")).toBeInTheDocument();
    expect(screen.queryByTestId("layer-header-collapsible-guidance")).not.toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
  });

  it("prompts before selecting a snapshot from a different subscription", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
    });

    fireEvent.click(screen.getByTestId("infra-drift-snapshot-row-33333333-3333-3333-3333-333333333333"));

    expect(await screen.findByTestId("infra-drift-cross-subscription-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-cross-subscription-dialog")).toHaveTextContent("Dev");
    expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
  });

  it("applies cross-subscription snapshot selection after confirmation", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Prod");
    });

    fireEvent.click(screen.getByTestId("infra-drift-snapshot-row-33333333-3333-3333-3333-333333333333"));
    fireEvent.click(await screen.findByTestId("infra-drift-cross-subscription-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-selected-snapshot-summary")).toHaveTextContent("Dev");
    });
    expect(screen.queryByTestId("infra-drift-cross-subscription-dialog")).not.toBeInTheDocument();
  });

  it("prompts before selecting a diff whose other snapshot is in a different subscription", async () => {
    mockFetchDiffs.mockResolvedValueOnce([
      {
        diffId: "diff-cross-sub",
        snapshotAId: "11111111-1111-1111-1111-111111111111",
        snapshotBId: "33333333-3333-3333-3333-333333333333",
        totalChanges: 1,
        createdUtc: "2026-09-01T12:00:00Z",
      },
    ]);

    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    const diffPicker = await screen.findByTestId("infra-drift-diff-picker");
    fireEvent.change(diffPicker, { target: { value: "diff-cross-sub" } });

    expect(await screen.findByTestId("infra-drift-cross-subscription-dialog")).toBeInTheDocument();
    expect(diffPicker).toHaveValue("");
    expect(mockFetchChanges).not.toHaveBeenCalled();
  });

  it("hides none and unknown risk rows when risky-only is enabled in the URL", async () => {
    mockFetchChanges.mockImplementationOnce(async () => ({
      items: [
        {
          changeId: "change-none",
          diffId: "diff-1",
          cloudResourceId: "22222222-2222-2222-2222-222222222222",
          azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-none",
          changeType: "ResourceModified",
          property: "tags",
          oldValue: "a",
          newValue: "b",
          riskClassification: null,
          evidenceReference: "snapshot-diff",
        },
        {
          changeId: "change-elevated",
          diffId: "diff-1",
          cloudResourceId: "33333333-3333-3333-3333-333333333333",
          azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gw",
          changeType: "NetworkExposureChanged",
          property: "publicNetworkAccess",
          oldValue: "Disabled",
          newValue: "Enabled",
          riskClassification: "elevated",
          evidenceReference: "snapshot-diff",
        },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 100,
      hasMore: false,
    }));

    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&riskyOnly=1",
    );
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-change-row-change-elevated")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("infra-drift-change-row-change-none")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-risky-only")).toBeChecked();
  });

  it("requests unchanged resources when include-unchanged is enabled in the URL", async () => {
    searchParams = new URLSearchParams(
      "snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1&includeUnchanged=1",
    );
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(mockFetchChanges).toHaveBeenCalledWith("diff-1", 1, 100, {
        cloudResourceId: null,
        includeUnchanged: true,
      });
    });

    expect(screen.getByTestId("infra-drift-include-unchanged")).toBeChecked();
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
