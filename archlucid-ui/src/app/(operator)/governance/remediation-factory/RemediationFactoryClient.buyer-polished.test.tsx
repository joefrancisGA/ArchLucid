import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SECURENOW_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_INVESTIGATION_EFFORT_PATH } from "@/lib/product-line/securenow-investigation-effort-copy";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/governance/remediation-factory",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: "security",
    assignmentOverrides: {},
    setProductLine: () => {},
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

vi.mock("@/hooks/use-operator-relative-freshness-now-ms", () => ({
  useOperatorRelativeFreshnessNowMs: () => Date.now(),
}));

vi.mock("@/app/(operator)/governance/remediation-factory/use-remediation-factory-url-state", () => ({
  useRemediationFactoryUrlState: () => ({
    findingId: null,
    pathId: null,
    fromSnapshotId: null,
    toSnapshotId: null,
    rankedPage: 1,
    hasSnapshotPair: false,
    selectFinding: vi.fn(),
    selectPath: vi.fn(),
    setSnapshotPair: vi.fn(),
    setRankedPage: vi.fn(),
    syncSelection: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => ({
    collectionInput: {
      hasConfiguredProvider: true,
      azureSubscriptionIdsPresent: true,
      hasSuccessfulPull: true,
    },
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-remediation-factory-query", () => ({
  useRemediationRankedFindingsQuery: () => ({
    dataUpdatedAt: Date.now(),
    isFetching: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
    data: [],
  }),
  useRemediationFactoryMetricsQuery: () => ({
    dataUpdatedAt: Date.now(),
    isFetching: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
    data: {
      openFindings: 0,
      riskWeightedOpen: 0,
      criticalExposureCount: 0,
      createdThisWeek: 0,
      remediatedThisWeek: 0,
      netBurn: 0,
      recurrenceCount: 0,
      patternCoverageExactMatchPercent: 0,
      automationPercent: 0,
      verificationFailureCount: 0,
      exceptionsActive: 0,
      exceptionsExpiringSoon: 0,
      exceptionsExpired: 0,
      businessBlockedCount: 0,
      averageAgeDays: 0,
      topControlIds: [],
      topPatternKeys: [],
    },
  }),
}));

vi.mock("@/hooks/use-security-evidence-ranked-paths-query", () => ({
  useSecurityEvidenceRankedPathsQuery: () => ({
    dataUpdatedAt: Date.now(),
    isFetching: false,
    isLoading: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
    data: { items: [], totalCount: 0, page: 1, pageSize: 25, topCutPoints: [] },
  }),
}));

vi.mock("@/hooks/use-security-evidence-path-report-query", () => ({
  useSecurityEvidencePathReportQuery: () => ({
    isLoading: false,
    isFetching: false,
    isSuccess: true,
    isError: false,
    refetch: vi.fn(),
    data: {
      snapshotId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      vulnerableAttackPaths: [],
      unevaluatedGroups: [],
    },
  }),
}));

vi.mock("@/lib/remediation-factory-api", () => ({
  fetchRemediationScoreExplanation: vi.fn(),
}));

vi.mock("@/components/security/SecureNowArchitectOutcomeMetricsPanel", () => ({
  SecureNowArchitectOutcomeMetricsPanel: (props: {
    snapshotsEmptyPreset?: { actions?: { href: string; label: string }[] };
  }) => (
    <div data-testid="securenow-architect-outcome-metrics-panel">
      {props.snapshotsEmptyPreset?.actions?.map((action) => (
        <a key={action.href} href={action.href}>
          {action.label}
        </a>
      ))}
    </div>
  ),
}));

vi.mock("@/components/security/SecurityEvidencePathInspectPanel", () => ({
  SecurityEvidencePathInspectPanel: () => <div data-testid="remediation-path-inspect-panel" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => null,
  };
});

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();
  const guidedWorkspace = {
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  };

  return {
    ...actual,
    useWorkspaceMode: () => guidedWorkspace,
    useWorkspaceModeOrDefault: () => guidedWorkspace,
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
  useProductionDeskChrome: () => false,
}));

import { RemediationFactoryClient } from "./RemediationFactoryClient";

describe("RemediationFactoryClient buyer-polished empty states", () => {
  it("surfaces drift and synthetic ROI when collection is ready but ranked paths are empty", () => {
    render(<RemediationFactoryClient />);

    const rankedPathsEmpty = screen.getByTestId("remediation-factory-ranked-paths-empty");
    expect(rankedPathsEmpty).toBeInTheDocument();
    expect(within(rankedPathsEmpty).getByRole("link", { name: "Synthetic ROI walkthrough" })).toHaveAttribute(
      "href",
      SECURENOW_INVESTIGATION_EFFORT_PATH,
    );

    const architectPanel = screen.getByTestId("securenow-architect-outcome-metrics-panel");
    expect(within(architectPanel).getByRole("link", { name: "Review changes and drift" })).toHaveAttribute(
      "href",
      SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
    );
  });
});
