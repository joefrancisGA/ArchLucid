import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

let searchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/governance/infrastructure/remediation",
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({ hub: null, loading: false, loadError: null }),
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

import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { RemediationWorkbenchClient } from "./RemediationWorkbenchClient";

describe("RemediationWorkbenchClient buyer-polished chrome", () => {
  it("renders skip link, claim discipline, lifecycle board, and sources strip", async () => {
    searchParams = new URLSearchParams("");
    render(<RemediationWorkbenchClient />);

    expect(screen.getByRole("link", { name: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("infra-remediation-claim-discipline")).toBeInTheDocument();
    expect(screen.getByTestId("governance-infrastructure-remediation-sources")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.queryByText("ADVANCED OPERATIONS")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("infra-remediation-board")).toBeInTheDocument();
    });
  });

  it("hides inline resource and finding ids behind disclosures when scoped", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=33333333-3333-3333-3333-333333333333&findingId=22222222-2222-2222-2222-222222222222",
    );

    render(<RemediationWorkbenchClient />);

    expect(await screen.findByTestId("infra-remediation-resource-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-finding-id-disclosure")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-resource-scope-banner")).toHaveTextContent("Scoped to resource.");
    expect(screen.getByTestId("infra-remediation-finding-scope-banner")).toHaveTextContent("Linked from finding.");
  });
});
