import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, beforeAll, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import { OperatorQueryProvider } from "@/components/operator/OperatorQueryProvider";
import * as demoUiEnv from "@/lib/demo-ui-env";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import * as facetsStorage from "@/lib/governance/governance-findings-queue-facets-storage";
import * as operatorScopeStorage from "@/lib/operator/operator-scope-storage";
import { ApiRequestError } from "@/lib/api-request-error";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";
import { BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE, BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE } from "@/lib/governance/governance-findings-evidence-copy";
import {
  GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID,
  GOVERNANCE_FINDINGS_SKIP_LINK_LABEL,
} from "@/lib/governance-findings-page-copy";

/** Mutable so a test can put the page in review scope (`?runId=`) without re-mocking the module. */
const searchParamsState = vi.hoisted(() => ({ current: new URLSearchParams() }));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => searchParamsState.current,
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: vi.fn().mockResolvedValue({ traces: [] }),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({ items: [] }),
}));

function renderGovernanceFindingsQueue(mode: "tenant" | "assigned-to-me" = "tenant") {
  return render(
    <OperatorQueryProvider>
      <GovernanceFindingsQueueClient mode={mode} />
    </OperatorQueryProvider>,
  );
}

const governanceStickinessApiMocks = vi.hoisted(() => ({
  getArchitectureDecisionRegister: vi.fn(),
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
    riskRegister: await governanceStickinessApiMocks.getArchitectureRiskRegister(),
    decisionRegister: await governanceStickinessApiMocks.getArchitectureDecisionRegister(),
  })),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => governanceStickinessApiMocks);

vi.mock("@/lib/buyer/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
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
  PageContextualHelpButton: () => null,
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

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
});

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

describe("GovernanceFindingsQueueClient", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    searchParamsState.current = new URLSearchParams();
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [] });
    vi.mocked(governanceApi.getArchitectureDecisionRegister).mockResolvedValue({ decisions: [] });
  });


  it("renders the governance job router chooser at the top (TB-2199 / TB-2230)", async () => {
    renderGovernanceFindingsQueue();

    const strip = await screen.findByTestId("governance-job-router");
    expect(strip).toHaveAttribute("data-current-job", "triage-findings");
    expect(screen.getByTestId("governance-job-router-option-triage-findings")).toHaveAttribute(
      "data-current",
      "true",
    );
    expect(screen.getByTestId("governance-job-router-option-approve-governance")).toHaveAttribute(
      "href",
      "/governance/approval-queue",
    );
    expect(screen.getByTestId("governance-job-router-option-record-decisions")).toHaveAttribute(
      "href",
      "/governance/decision-register",
    );
  });

  it("renders architecture posture overview above the findings filter bar (TB-2378)", async () => {
    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("architecture-posture-pillar-overview")).toBeInTheDocument();
    expect(governanceStickinessApiMocks.getGovernancePosture).toHaveBeenCalledWith("proj-1");
  });

  it("uses Governance Findings route title consistent with nav labels", () => {
    expect(ROUTE_TITLES["/governance/findings"]).toBe(OPERATOR_NAV_LINK_LABELS.findings);
  });

  it("does not render a duplicate explain-this-view card for the risk register route", () => {
    expect(routeViewExplanationForPathname("/governance/findings")).toBeNull();
  });

  it("renders empty state guidance, actions, and summary metrics", async () => {
    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("governance-findings-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No risks recorded for this review")).toBeInTheDocument();
    expect(
      screen.getByText(/Risks appear here when accepted findings, waivers, exceptions, or approval decisions/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open reviews" })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getByRole("link", { name: "Open resolve outcomes" })).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: "View policy packs" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );

    expect(screen.getByTestId("architecture-risk-register-summary-open-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=open",
    );
    expect(screen.getByTestId("architecture-risk-register-summary-expiring-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=expiring-soon",
    );
    expect(screen.getByTestId("architecture-risk-register-summary-owner-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=no-owner",
    );
    expect(screen.getByTestId("architecture-risk-register-summary-overdue-value")).toHaveAttribute(
      "href",
      "/governance/findings?filter=overdue-review",
    );

    expect(screen.queryByText("Terminology reference")).not.toBeInTheDocument();
  });

  it("renders Report problem when the risk register load fails (TB-786)", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(new Error("network"));

    renderGovernanceFindingsQueue();

    const failure = await screen.findByTestId("governance-findings-load-failed");
    expect(failure).toHaveAttribute("role", "alert");
    expect(screen.getByRole("heading", { name: "Could not load architecture risk register" })).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-retry-load")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-findings-empty-state")).not.toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });

  it("retries the risk register load from the failure state", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValue({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("governance-findings-retry-load")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("governance-findings-retry-load"));

    expect(await screen.findByTestId("architecture-risk-register-filters", {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByTestId("governance-findings-load-failed")).not.toBeInTheDocument();
  });

  it("does not render Report problem on benign empty risk register", async () => {
    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("governance-findings-empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("report-problem-trigger")).not.toBeInTheDocument();
  });

  it("renders the Findings nav icon in the page header", async () => {
    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("architecture-risk-register-page-title")).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
  });

  it("renders operational table rows and filters when risk data is loaded", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("architecture-risk-register-filters")).toBeInTheDocument();
    // Accepted disposition lands in ready-for-sponsor-packet (default job view is needs-my-decision).
    fireEvent.click(screen.getByTestId("finding-job-view-ready-for-sponsor-packet"));
    expect(screen.getByRole("columnheader", { name: "Risk" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Source review" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Exception expiry" })).toBeInTheDocument();
    const desktopRegion = screen.getByTestId("governance-findings-queue-keyboard-region");

    expect(within(desktopRegion).getByRole("link", { name: "PHI minimization risk" })).toBeInTheDocument();
    expect(within(desktopRegion).getByRole("link", { name: "View risk" })).toBeInTheDocument();
    expect(within(desktopRegion).getByRole("link", { name: "Open source review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1",
    );
    expect(within(desktopRegion).getByRole("link", { name: "View exception" })).toHaveAttribute(
      "href",
      "/governance/exceptions",
    );

    const mobileRegion = screen.getByTestId("governance-findings-queue-mobile");
    expect(within(mobileRegion).getByRole("link", { name: "View risk" })).toBeInTheDocument();
    expect(within(mobileRegion).getByRole("link", { name: "View exception" })).toHaveAttribute(
      "href",
      "/governance/exceptions",
    );
    expect(screen.getByTestId("architecture-risk-register-summary-open-value")).toHaveTextContent("1");
    expect(screen.getByTestId("bulk-triage-remaining-progress")).toHaveTextContent("1 of 1 left");
  });

  /**
   * Each header metric is labelled "in this review" and drills in with the same `runId`, so it must
   * count only the scoped review — a workspace-wide count read as a review count.
   */
  it("counts only the scoped review in the header metrics", async () => {
    searchParamsState.current = new URLSearchParams({ runId: "run-1" });
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({
      entries: [
        { ...loadedRiskRow, findingId: "finding-1", statusLabel: "Open", latestDisposition: null },
        {
          ...loadedRiskRow,
          runId: "run-2",
          findingId: "finding-2",
          statusLabel: "Open",
          latestDisposition: null,
        },
      ],
    });

    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("architecture-risk-register-filters")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-risk-register-summary-open-value")).toHaveTextContent("1");
  });

  /** The rows are findings everywhere else in the product; "risks" here read as a different object. */
  it("calls the scoped rows findings in the run-scope banner", async () => {
    searchParamsState.current = new URLSearchParams({ runId: "run-1" });
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue();

    const banner = await screen.findByTestId("governance-findings-run-scope-banner");

    expect(banner).toHaveTextContent("Showing findings for review");
    expect(banner.textContent ?? "").not.toContain("Showing risks");
  });
});

describe("GovernanceFindingsQueueClient assigned-to-me mode", () => {
  beforeEach(() => {
    // Without this reset the cached success from the previous describe block satisfies the render,
    // so a rejecting mock never reaches the component.
    resetOperatorQueryClientForTests();
    searchParamsState.current = new URLSearchParams();
    vi.mocked(operatorScopeStorage.readOperatorScopeFromStorage).mockReturnValue({
      tenantId: "tenant-1",
      workspaceId: "ws-1",
      projectId: "proj-1",
      workspaceLabel: BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
      projectLabel: "Default",
    });
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [] });
    vi.mocked(governanceApi.getArchitectureDecisionRegister).mockResolvedValue({ decisions: [] });
    vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(false);
    vi.spyOn(facetsStorage, "readGovernanceFindingsQueueFacets").mockReturnValue({
      registerFilter: "all",
      jobView: "needs-my-decision",
      nlFacets: { severity: null, status: null, titleKeywords: [] },
    });
  });

  it("uses assigned-to-me failure copy without risk-register scope language", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(new Error("network"));

    renderGovernanceFindingsQueue("assigned-to-me");

    expect(await screen.findByRole("heading", { name: "Could not load your assigned findings" })).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-posture-pillar-overview")).not.toBeInTheDocument();
    expect(screen.queryByText(/risk register/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/risks for this review/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/this review/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-load-failed")).toHaveAttribute("role", "alert");
  });

  it("renders benign empty state distinct from load failure", async () => {
    renderGovernanceFindingsQueue("assigned-to-me");

    const empty = await screen.findByTestId("governance-findings-empty-state");
    expect(empty).toHaveAttribute("role", "status");
    expect(screen.getByText("No findings assigned to you")).toBeInTheDocument();
    expect(within(empty).getByText(/Jordan Lee \(Architect\)/)).toBeInTheDocument();
    expect(within(empty).getByText(new RegExp(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL))).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-empty-checked-at")).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-empty-basis")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-findings-load-failed")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open findings queue" })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByTestId("governance-assigned-to-me-header-actions")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Refresh" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Open reviews" })).not.toBeInTheDocument();
  });

  it("does not render raw workspace ids when operator scope storage is empty", async () => {
    vi.mocked(operatorScopeStorage.readOperatorScopeFromStorage).mockReturnValue(null);

    renderGovernanceFindingsQueue("assigned-to-me");

    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const workspace = await screen.findByTestId("governance-assigned-to-me-workspace");
    const checkedAt = await screen.findByTestId("governance-assigned-to-me-empty-checked-at");

    expect(workspace.textContent ?? "").not.toMatch(uuidPattern);
    expect(checkedAt.textContent ?? "").not.toMatch(uuidPattern);
    expect(workspace).toHaveTextContent(BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL);
  });

  it("renders related queues disclosure, breadcrumb, and queue status after the work object", async () => {
    renderGovernanceFindingsQueue("assigned-to-me");

    expect(await screen.findByTestId("governance-assigned-to-me-breadcrumb")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Approval" })).toHaveAttribute("href", "/governance/approval-queue");
    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByTestId("governance-assigned-to-me-workspace")).toHaveTextContent(
      BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL,
    );
    expect(await screen.findByTestId("governance-assigned-to-me-queue-status")).toHaveTextContent(
      "0 open findings assigned",
    );
    expect(screen.getByTestId("governance-assigned-to-me-last-checked")).toBeInTheDocument();

    const body = screen.getByTestId("governance-findings-queue-body");
    const empty = within(body).getByTestId("governance-findings-empty-state");
    const disclosure = within(body).getByTestId("governance-findings-related-queues-disclosure");
    expect(within(disclosure).getByTestId("governance-job-router")).toHaveAttribute(
      "data-current-job",
      "assigned-to-me-findings",
    );
    expect(empty.compareDocumentPosition(disclosure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps header refresh visible while loading", () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockImplementation(
      () => new Promise(() => undefined),
    );

    renderGovernanceFindingsQueue("assigned-to-me");

    expect(screen.getByTestId("governance-assigned-to-me-header-actions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-last-checked")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-assigned-to-me-queue-status")).not.toBeInTheDocument();
  });

  it("surfaces failure diagnostics for assigned-to-me loads", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(
      new ApiRequestError("upstream unavailable", {
        problem: { title: "Unavailable", status: 503, errorCode: "DATABASE_UNAVAILABLE" },
        correlationId: "corr-assigned-ui",
        httpStatus: 503,
      }),
    );

    renderGovernanceFindingsQueue("assigned-to-me");

    expect(await screen.findByTestId("enterprise-inline-error-diagnostics")).toBeInTheDocument();
    expect(screen.getByText("corr-assigned-ui")).toBeInTheDocument();
    expect(screen.getByText("DATABASE_UNAVAILABLE")).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-last-checked")).toBeInTheDocument();
  });

  it("shows assigned queue status and header refresh while populated", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue("assigned-to-me");

    expect(await screen.findByTestId("governance-assigned-to-me-queue-status")).toHaveTextContent(
      "1 open finding assigned",
    );
    expect(screen.getByTestId("governance-assigned-to-me-header-actions")).toBeInTheDocument();
    expect(screen.getByTestId("governance-assigned-to-me-last-checked")).toBeInTheDocument();
  });

  it("shows job view filter chip when the filter bar is visible and job view is non-default", async () => {
    vi.spyOn(facetsStorage, "readGovernanceFindingsQueueFacets").mockReturnValue({
      registerFilter: "all",
      jobView: "ready-for-sponsor-packet",
      nlFacets: { severity: null, status: null, titleKeywords: [] },
    });
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue("assigned-to-me");

    expect(await screen.findByTestId("governance-findings-job-view-filter-chip")).toBeInTheDocument();
  });

  it("suppresses the governance approval banner when the assigned-to-me load fails in buyer shell", async () => {
    vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(true);
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockRejectedValue(new Error("network"));

    renderGovernanceFindingsQueue("assigned-to-me");

    expect(await screen.findByTestId("governance-findings-load-failed")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-approval-status-banner")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View approval record" })).not.toBeInTheDocument();
  });

  it("renders skip link, breadcrumb, and orientation after queue body in buyer shell", async () => {
    vi.spyOn(demoUiEnv, "isBuyerPolishedOperatorShellEnv").mockReturnValue(true);
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue();

    expect(screen.getByRole("link", { name: GOVERNANCE_FINDINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("governance-findings-breadcrumb")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-risk-register-page-title")).toHaveTextContent(
      BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
    );
    expect(screen.getByTestId("governance-findings-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-claim-discipline").textContent).toContain(
      GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("layer-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("alerts-findings-vocabulary")).not.toBeInTheDocument();

    const orientationTop = screen.getByTestId("governance-findings-orientation-top");
    const queueBody = screen.getByTestId("governance-findings-queue-body");

    expect(queueBody).toContainElement(orientationTop);
    expect(queueBody.compareDocumentPosition(orientationTop) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(queueBody).toHaveAttribute("id", GOVERNANCE_FINDINGS_PRIMARY_CONTENT_ID);
  });
});
