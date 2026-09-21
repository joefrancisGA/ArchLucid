import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";
import * as facetsStorage from "@/lib/governance/governance-findings-queue-facets-storage";

const searchParamsState = vi.hoisted(() => ({ query: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/security/assigned-to-me",
  useSearchParams: () => new URLSearchParams(searchParamsState.query),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "security" }),
}));

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: vi.fn().mockResolvedValue({ traces: [] }),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({ items: [] }),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn().mockResolvedValue({ decisions: [] }),
  getArchitectureRiskRegister: vi.fn(),
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
  getGovernanceAssignedToMeFindingsCount: vi.fn().mockResolvedValue({ count: 0 }),
}));

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: null,
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
        primaryAppRole: "Admin",
        hasCommittedArchitectureReview: true,
      },
      callerAuthorityRank: 2,
      isAuthorityLoading: false,
    }),
    useNavCallerAuthorityRank: () => 2,
  };
});

vi.mock("@/lib/operator/operator-scope-storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-scope-storage")>();

  return {
    ...actual,
    readOperatorScopeFromStorage: vi.fn(() => ({
      tenantId: "tenant-1",
      workspaceId: "ws-1",
      projectId: "proj-1",
      workspaceLabel: BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
      projectLabel: "Default",
    })),
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

function renderSecureNowAssignedToMeQueue(): ReturnType<typeof render> {
  return render(
    <OperatorQueryProvider>
      <GovernanceFindingsQueueClient mode="assigned-to-me" />
    </OperatorQueryProvider>,
  );
}

describe("GovernanceFindingsQueueClient SecureNow /security/assigned-to-me", () => {
  beforeEach(() => {
    searchParamsState.query = "";
    resetOperatorQueryClientForTests();
    vi.mocked(operatorScopeStorage.readOperatorScopeFromStorage).mockReturnValue({
      tenantId: "tenant-1",
      workspaceId: "ws-1",
      projectId: "proj-1",
      workspaceLabel: BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
      projectLabel: "Default",
    });
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [] });
  });

  it("shows register-only status, principal scope, and SecureNow findings queue link on empty load", async () => {
    renderSecureNowAssignedToMeQueue();

    expect(await screen.findByTestId("governance-assigned-to-me-principal-scope")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    );
    expect(await screen.findByTestId("governance-assigned-to-me-principal-scope")).toHaveTextContent(
      "Jordan Lee (Admin)",
    );
    expect(await screen.findByTestId("governance-assigned-to-me-queue-status")).toHaveTextContent(
      "register-only check",
    );
    expect(screen.queryByTestId("governance-assigned-to-me-empty-checked-at")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open findings queue" })).toHaveAttribute(
      "href",
      "/compliance/findings",
    );
    expect(screen.queryByRole("link", { name: "View audit trail" })).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-zero-row-resume")).toBeInTheDocument();
  });

  it("shows active job-view filters at zero rows", async () => {
    searchParamsState.query = "findingJobView=ready-for-sponsor-packet";

    renderSecureNowAssignedToMeQueue();

    expect(await screen.findByTestId("governance-findings-active-filter-chips")).toBeInTheDocument();
  });

  it("keeps orientation sources inside SecureNow navigation", async () => {
    renderSecureNowAssignedToMeQueue();

    await waitFor(() => {
      expect(screen.getByTestId("governance-assigned-to-me-orientation-bottom")).toBeInTheDocument();
    });

    const orientation = screen.getByTestId("governance-assigned-to-me-orientation-bottom");
    const links = orientation.querySelectorAll("a[href]");

    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith("/architecture/")).toBe(false);
      expect(href).not.toBe("/pricing");
    }
  });
});
