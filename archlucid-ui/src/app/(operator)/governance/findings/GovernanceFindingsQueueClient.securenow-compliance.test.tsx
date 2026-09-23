import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/compliance/findings",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true, mode: "working" }),
}));

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: vi.fn().mockResolvedValue({ traces: [] }),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn().mockResolvedValue({ decisions: [] }),
  getArchitectureRiskRegister: vi.fn().mockResolvedValue({ entries: [] }),
  getGovernancePosture: vi.fn().mockResolvedValue({
    pillars: [],
    reviewIntegrity: {
      criticalCount: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      dispositionedCount: 0,
      mutedCount: 0,
    },
    uncategorizedCount: 0,
    primaryPillarKey: null,
    latestSnapshotCreatedUtc: null,
    isDegraded: false,
  }),
  fetchGovernanceFindingsRegistersBundle: vi.fn(async () => ({
    riskRegister: await governanceApi.getArchitectureRiskRegister(),
    decisionRegister: await governanceApi.getArchitectureDecisionRegister(),
  })),
}));

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Findings",
      headline: "Track architecture risks created from accepted findings, waivers, exceptions, and approval decisions.",
      useWhen: "Start with open risks, expiring exceptions, or risks without owners.",
      firstPilotNote: null,
      enterpriseFootnote: "Each row should trace back to its source review, evidence trail, and finalized review record.",
      omitReviewPackageScopeHelp: true,
    },
    contextHints: {
      enterpriseNavGroupHint: "",
      enterpriseExecutePageHint: null,
      layerHeaderEnterpriseRankCue: null,
      governanceResolutionRank: "",
      alertsInboxRank: "",
      auditLogRank: "",
      alertOperatorToolingRank: "",
      governanceDashboardReaderAction: null,
    },
    callerAuthorityRank: 0,
    showExtended: true,
    showAdvanced: true,
    mounted: true,
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/operator/OperatorNavAuthorityProvider")>();

  return {
    ...actual,
    useOperatorNavAuthority: () => ({
      currentPrincipal: {
        name: "Jordan Lee",
        roleClaimValues: [],
        authorityRank: 2,
        primaryAppRole: "Architect",
        hasCommittedArchitectureReview: true,
      },
      callerAuthorityRank: 2,
      isAuthorityLoading: false,
    }),
    useNavCallerAuthorityRank: () => 2,
  };
});

vi.mock("@/components/usability/ItsmOutboundQuickActions", () => ({
  ItsmOutboundQuickActions: () => null,
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

describe("GovernanceFindingsQueueClient SecureNow /compliance/findings working mode", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
  });

  it("renders context strip, refresh control, and keyboard affordance without posture during load failure", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(new Error("network"));

    render(
      <OperatorQueryProvider>
        <GovernanceFindingsQueueClient />
      </OperatorQueryProvider>,
    );

    expect(await screen.findByTestId("governance-findings-queue-context-strip")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-queue-keyboard-affordance")).toHaveTextContent(/page help/i);
    expect(await screen.findByTestId("governance-findings-load-failed")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-posture-pillar-overview")).not.toBeInTheDocument();
  });
});
