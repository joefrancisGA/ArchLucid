import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import GovernanceFindingsQueueClient from "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { getBreadcrumbs } from "@/lib/breadcrumb-map";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/governance/findings",
  useSearchParams: () => ({
    get: () => null,
    toString: () => "",
  }),
}));

vi.mock("@/lib/api", () => ({
  getRunExplanationSummary: vi.fn().mockResolvedValue({ traces: [] }),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({ runs: [] }),
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  getArchitectureDecisionRegister: vi.fn(),
  getArchitectureRiskRegister: vi.fn(),
}));

vi.mock("@/lib/buyer-demo-content-gating", () => ({
  shouldUseGovernanceCuratedDemoSpine: () => false,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => false,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    links: [],
    mutationCapability: false,
    layerGuidance: {
      layerBadge: "Risk register",
      headline: "Track architecture risks created from accepted findings, waivers, exceptions, and governance decisions.",
      useWhen: "Start with open risks, expiring exceptions, or risks without owners.",
      firstPilotNote: null,
      enterpriseFootnote: "Each row should trace back to its source review package, evidence trail, and signed review record.",
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

  it("maps governance findings breadcrumb to Governance / Findings", () => {
    expect(getBreadcrumbs("/governance/findings")).toEqual([
      { label: "Governance", href: "/governance" },
      { label: "Findings" },
    ]);
  });

  it("renders helper card copy for the risk register route", () => {
    const explanation = routeViewExplanationForPathname("/governance/findings");

    expect(explanation?.title).toBe("Risk register");
    expect(explanation?.summary).toContain("Track architecture risks created from findings");
    expect(explanation?.nextAction).toContain("Open review packages or governance workflow to create risk records");
  });

  it("renders empty state guidance, actions, summary metrics, and collapsed terminology", async () => {
    render(<GovernanceFindingsQueueClient />);

    expect(await screen.findByTestId("governance-findings-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No architecture risks yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Risks appear here after review findings are accepted into governance/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open review packages" })).toHaveAttribute(
      "href",
      "/reviews?projectId=default",
    );
    expect(screen.getByRole("link", { name: "Open governance workflow" })).toHaveAttribute("href", "/governance");
    expect(screen.getByRole("link", { name: "View policy packs" })).toHaveAttribute(
      "href",
      "/governance/policy-packs",
    );

    expect(screen.getByTestId("architecture-risk-register-summary-open")).toHaveTextContent("Open risks: 0");
    expect(screen.getByTestId("architecture-risk-register-summary-expiring")).toHaveTextContent(
      "Expiring exceptions: 0",
    );
    expect(screen.getByTestId("architecture-risk-register-summary-owner")).toHaveTextContent("Pending owner: 0");
    expect(screen.getByTestId("architecture-risk-register-summary-overdue")).toHaveTextContent("Overdue review: 0");

    const terminology = screen.getByText("Terminology reference").closest("details");

    expect(terminology).not.toBeNull();
    expect(terminology).not.toHaveAttribute("open");
    expect(within(terminology as HTMLElement).getByText("Architecture review")).toBeInTheDocument();
    expect(screen.queryByText("Proof packet")).not.toBeInTheDocument();
  });

  it("renders operational table rows and filters when risk data is loaded", async () => {
    vi.mocked(governanceApi.getArchitectureRiskRegister).mockResolvedValue({ entries: [loadedRiskRow] });

    render(<GovernanceFindingsQueueClient />);

    expect(await screen.findByTestId("architecture-risk-register-filters")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Risk" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Source review package" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Exception expiry" })).toBeInTheDocument();
    const desktopRegion = screen.getByTestId("governance-findings-queue-keyboard-region");

    expect(within(desktopRegion).getByRole("link", { name: "PHI minimization risk" })).toBeInTheDocument();
    expect(within(desktopRegion).getByRole("link", { name: "View risk" })).toBeInTheDocument();
    expect(within(desktopRegion).getByRole("link", { name: "Open source review" })).toHaveAttribute(
      "href",
      "/reviews/run-1",
    );
    expect(within(desktopRegion).getByRole("link", { name: "View exception" })).toHaveAttribute(
      "href",
      "/governance/risk-exceptions",
    );
    expect(screen.getByTestId("architecture-risk-register-summary-open")).toHaveTextContent("Open risks: 1");
  });
});
