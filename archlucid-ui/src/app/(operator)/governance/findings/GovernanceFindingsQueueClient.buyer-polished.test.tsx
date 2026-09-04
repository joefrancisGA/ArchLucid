import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD, BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_ASSIGNED_TO_ME_CLAIM_DISCIPLINE } from "@/lib/governance/governance-assigned-to-me-evidence-copy";
import {
  GOVERNANCE_ASSIGNED_TO_ME_PRIMARY_CONTENT_ID,
  GOVERNANCE_ASSIGNED_TO_ME_SKIP_LINK_LABEL,
} from "@/lib/governance/governance-assigned-to-me-page-copy";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/governance/findings/assigned-to-me",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

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
}));

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

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
        primaryAppRole: "Architect",
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

const loadedRiskRow = {
  runId: "run-1",
  runLabel: "Claims Intake Review",
  manifestId: "manifest-1",
  findingId: "finding-1",
  title: "PHI minimization risk",
  severity: "High",
  category: "Privacy",
  statusLabel: "Accepted · monitoring",
  ownerUserId: "owner@contoso.com",
  latestDisposition: "Accepted",
  agingDays: 12,
  waiverExpiresAtUtc: "2026-07-10T00:00:00.000Z",
  lastReviewedUtc: "2026-06-01T00:00:00.000Z",
  revisitDueUtc: "2026-08-01T00:00:00.000Z",
  isStale: false,
  evidenceHref: "/graph?runId=run-1",
  humanReviewStatus: null,
  itsmLinkedTicketsSummary: null,
  systemName: "Claims Intake",
  resourceId: null,
};

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

function renderAssignedToMeQueue(): ReturnType<typeof render> {
  return render(
    <OperatorQueryProvider>
      <GovernanceFindingsQueueClient mode="assigned-to-me" />
    </OperatorQueryProvider>,
  );
}

describe("GovernanceFindingsQueueClient buyer-polished shell (GOF)", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    vi.mocked(operatorScopeStorage.readOperatorScopeFromStorage).mockReturnValue({
      tenantId: "tenant-1",
      workspaceId: "ws-1",
      projectId: "proj-1",
      workspaceLabel: BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
      projectLabel: "Default",
    });
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });
    vi.mocked(governanceApi.getArchitectureDecisionRegister).mockResolvedValue({ decisions: [] });
  });

  it("renders skip link, primary landmark, orientation strip, and buyer subtitle", async () => {
    renderAssignedToMeQueue();

    expect(screen.getByRole("link", { name: GOVERNANCE_ASSIGNED_TO_ME_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_ASSIGNED_TO_ME_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("governance-findings-queue-body")).toHaveAttribute(
      "id",
      GOVERNANCE_ASSIGNED_TO_ME_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByText(BUYER_GOVERNANCE_ASSIGNED_TO_ME_PAGE_LEAD)).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-claim-discipline").textContent).toContain(
      GOVERNANCE_ASSIGNED_TO_ME_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("findings-queue-pick-review-before-triage")).not.toBeInTheDocument();

    const body = screen.getByTestId("governance-findings-queue-body");
    const orientationTop = await screen.findByTestId("governance-assigned-to-me-orientation-top");

    expect(body).toContainElement(orientationTop);
    expect(body.compareDocumentPosition(orientationTop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId("governance-assigned-to-me-settings-sources")).toBeInTheDocument();
    expect(await screen.findByTestId("governance-assigned-to-me-queue-status")).toBeInTheDocument();
  });
});
