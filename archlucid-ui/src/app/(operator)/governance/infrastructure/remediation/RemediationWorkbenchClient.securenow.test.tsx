import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/security/remediation-instances",
  useSearchParams: () => searchParams,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
}));

vi.mock("@/hooks/use-operator-relative-freshness-now-ms", () => ({
  useOperatorRelativeFreshnessNowMs: () => Date.now(),
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
        resourceCount: 12,
        relationshipCount: 4,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    hasMore: false,
  })),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => [
    {
      instanceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      findingId: "22222222-2222-2222-2222-222222222222",
      patternKey: "storage.encrypt-at-rest",
      status: "PreflightBlocked",
      automationLevel: "Guided",
      cloudResourceId: "33333333-3333-3333-3333-333333333333",
      waveId: null,
      createdUtc: "2026-09-01T12:00:00Z",
      updatedUtc: "2026-09-01T12:00:00Z",
    },
  ]),
  fetchRemediationFactorySummary: vi.fn(async () => ({
    factoryMetrics: {
      openFindings: 4,
      remediatedThisWeek: 1,
      verificationFailureCount: 0,
      businessBlockedCount: 1,
    },
    openInstancesByStatus: { PreflightBlocked: 1 },
    waves: [{ waveId: "wave-1", name: "Wave A", status: "Active", memberCount: 2, targetSize: 5 }],
  })),
  fetchRemediationPrioritizedFindings: vi.fn(async () => []),
  fetchRemediationWaves: vi.fn(async () => [{ waveId: "wave-1", name: "Wave A" }]),
  fetchRemediationInstanceDetail: vi.fn(async () => ({
    instance: {
      instanceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      findingId: "22222222-2222-2222-2222-222222222222",
      patternKey: "storage.encrypt-at-rest",
      status: "PreflightBlocked",
      automationLevel: "Guided",
      cloudResourceId: "33333333-3333-3333-3333-333333333333",
      waveId: null,
      createdUtc: "2026-09-01T12:00:00Z",
      updatedUtc: "2026-09-01T12:00:00Z",
    },
    finding: null,
    activeMatch: null,
    evidence: [],
  })),
  matchOperationalFinding: vi.fn(),
  createRemediationInstance: vi.fn(),
  runRemediationPreflight: vi.fn(),
  approveRemediationInstance: vi.fn(),
  assignRemediationWave: vi.fn(),
  executeRemediationInstance: vi.fn(),
  verifyRemediationInstance: vi.fn(),
  closeRemediationInstance: vi.fn(),
  formatInfraEvidenceRemediationApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Remediation factory",
      useWhen: "Track instances",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

import { RemediationWorkbenchClient } from "./RemediationWorkbenchClient";

describe("RemediationWorkbenchClient SecureNow /security/remediation-instances", () => {
  it("renders context strip, refresh control, and blocked lifecycle reasons", async () => {
    searchParams = new URLSearchParams("");
    render(<RemediationWorkbenchClient />);

    expect(await screen.findByTestId("remediation-workbench-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-last-refreshed")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("infra-remediation-board")).toBeInTheDocument();
    });

    fireEvent.click(await screen.findByTestId("infra-remediation-card-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));

    expect(await screen.findByTestId("infra-remediation-preflight-blocked-reason")).toHaveTextContent(/preflight/i);
    expect(screen.getByTestId("infra-remediation-create-blocked-reason")).toHaveTextContent(/finding id/i);
  });
});
