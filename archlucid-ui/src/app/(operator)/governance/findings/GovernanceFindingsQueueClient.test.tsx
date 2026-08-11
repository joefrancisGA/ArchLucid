import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, beforeAll, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import { OperatorQueryProvider } from "@/components/OperatorQueryProvider";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { ROUTE_TITLES } from "@/lib/route-static-titles";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: vi.fn().mockResolvedValue({ traces: [] }),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({ items: [] }),
}));

function renderGovernanceFindingsQueue() {
  return render(
    <OperatorQueryProvider>
      <GovernanceFindingsQueueClient />
    </OperatorQueryProvider>,
  );
}

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn(),
  getArchitectureRiskRegister: vi.fn(),
}));

vi.mock("@/lib/buyer-demo-content-gating", () => ({
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
      headline: "Track architecture risks created from accepted findings, waivers, exceptions, and governance decisions.",
      useWhen: "Start with open risks, expiring exceptions, or risks without owners.",
      firstPilotNote: null,
      enterpriseFootnote: "Each row should trace back to its source review, evidence trail, and signed review record.",
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
      screen.getByText(/Risks appear here when accepted findings, waivers, exceptions, or governance decisions/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open reviews" })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
    expect(screen.getByRole("link", { name: "Open governance workflow" })).toHaveAttribute("href", "/governance/approval-queue");
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

    expect(await screen.findByTestId("governance-findings-load-failed")).toBeInTheDocument();
    expect(screen.getByText("Could not load architecture risk register")).toBeInTheDocument();
    expect(screen.getByTestId("governance-findings-retry-load")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-findings-empty-state")).not.toBeInTheDocument();
    expect(screen.getByTestId("fatal-page-report-problem-row")).toBeInTheDocument();
    expect(screen.getByTestId("report-problem-trigger")).toBeInTheDocument();
  });

  it("retries the risk register load from the failure state", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister)
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ entries: [loadedRiskRow] });

    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("governance-findings-retry-load")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("governance-findings-retry-load"));

    expect(await screen.findByTestId("architecture-risk-register-filters")).toBeInTheDocument();
    expect(screen.queryByTestId("governance-findings-load-failed")).not.toBeInTheDocument();
  });

  it("does not render Report problem on benign empty risk register", async () => {
    renderGovernanceFindingsQueue();

    expect(await screen.findByTestId("governance-findings-empty-state")).toBeInTheDocument();
    expect(screen.queryByTestId("report-problem-trigger")).not.toBeInTheDocument();
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
});
