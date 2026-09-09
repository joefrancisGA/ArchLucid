import { render, screen, waitFor } from "@testing-library/react";
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
  downloadInfraEvidenceTerraformAdvisoryZip: vi.fn(async () => undefined),
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
  });

  it("renders snapshot picker and export button", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111");
    render(<DriftWorkbenchClient />);

    expect(await screen.findByTestId("infra-drift-snapshot-picker")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-export-terraform")).toBeInTheDocument();
    expect(screen.getByTestId("infra-drift-export-terraform")).not.toBeDisabled();
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
    expect(screen.getByTestId("infra-drift-change-row-change-1")).toHaveAttribute("aria-selected", "true");
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
    expect(row).toHaveTextContent("publicIPAddresses · rg");
    expect(row).not.toHaveTextContent("/subscriptions/");
  });

  it("keeps snapshot ids behind disclosure and uses human snapshot labels", async () => {
    searchParams = new URLSearchParams("snapshotId=11111111-1111-1111-1111-111111111111&diffId=diff-1");
    render(<DriftWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-drift-snapshot-picker")).toHaveTextContent("Prod");
    });
    expect(screen.getByTestId("infra-drift-snapshot-picker")).not.toHaveTextContent(
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
});
