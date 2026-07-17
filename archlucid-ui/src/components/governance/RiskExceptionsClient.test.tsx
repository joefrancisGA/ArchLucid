import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";

import RiskExceptionsClient from "@/components/governance/RiskExceptionsClient";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION } from "@/lib/buyer-polish-copy";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  defaultRiskExceptionExpiresAtUtc: vi.fn(() => "2099-01-01T00:00:00.000Z"),
  listRiskExceptions: vi.fn(),
  renewRiskException: vi.fn(),
  revokeRiskException: vi.fn(),
}));

const demoUiEnvMock = vi.hoisted(() => ({ buyerPolishedShell: false }));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => demoUiEnvMock.buyerPolishedShell,
  isNextPublicDemoMode: () => false,
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Governance",
      headline: "Track active waivers, expirations, owners, and linked governance decisions.",
      useWhen: "Use this page to track owner, expiration, evidence, and the linked decision record.",
      firstPilotNote: null,
      enterpriseFootnote: "Risk exceptions are approved waivers for findings that are not immediately remediated.",
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

const soonExpiry = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
const laterExpiry = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

describe("RiskExceptionsClient", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;

    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([
      {
        riskExceptionId: "11111111-1111-1111-1111-111111111111",
        findingId: "finding-a",
        ownerUserId: "owner@contoso.com",
        rationale: "Accepted residual risk for legacy subnet.",
        expiresAtUtc: laterExpiry,
        status: "Active",
      },
      {
        riskExceptionId: "22222222-2222-2222-2222-222222222222",
        findingId: "finding-b",
        ownerUserId: "owner2@contoso.com",
        rationale: "Short-term waiver while patch ships.",
        expiresAtUtc: soonExpiry,
        status: "Active",
      },
      {
        riskExceptionId: "33333333-3333-3333-3333-333333333333",
        findingId: "finding-c",
        ownerUserId: "owner3@contoso.com",
        rationale: "Third waiver.",
        expiresAtUtc: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Active",
      },
    ]);
  });

  it("renders table rows for active exceptions", async () => {
    render(<RiskExceptionsClient />);

    expect(await screen.findByText("finding-b")).toBeInTheDocument();
    expect(screen.getAllByRole("row").length).toBeGreaterThan(3);
  });

  it("shows expiring-soon warning when any risk exception is within 14 days", async () => {
    render(<RiskExceptionsClient />);

    expect(await screen.findByTestId("risk-exceptions-expiring-warning")).toBeInTheDocument();
    expect(screen.getByText(/risk exception/)).toBeInTheDocument();
  });

  it("shows empty state with primary and secondary actions", async () => {
    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([]);

    render(<RiskExceptionsClient />);

    expect(await screen.findByText("No active risk exceptions")).toBeInTheDocument();
    expect(
      screen.getByText(/Risk exceptions appear here when a finding is waived or deferred through governance/),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open findings" })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByRole("link", { name: "Open governance workflow" })).toHaveAttribute("href", "/governance");
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toHaveAttribute("href", "/reviews/new");
  });

  it("uses risk-exceptions layer guidance instead of governance workflow copy in operator shell", async () => {
    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([]);

    render(<RiskExceptionsClient />);

    expect(
      await screen.findByText("Track active waivers, expirations, owners, and linked governance decisions."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Submit finalized architecture outputs for governance review and promotion."),
    ).not.toBeInTheDocument();
  });

  it("renders governance approval banner instead of layer guidance in buyer shell", async () => {
    demoUiEnvMock.buyerPolishedShell = true;
    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([]);

    render(<RiskExceptionsClient />);

    expect(await screen.findByTestId("governance-approval-status-banner")).toBeInTheDocument();
    expect(
      screen.queryByText("Track active waivers, expirations, owners, and linked governance decisions."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View governance decisions" })).toHaveAttribute("href", "/governance");
    expect(screen.getByRole("link", { name: BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION })).toHaveAttribute(
      "href",
      "/reviews/new",
    );
  });

  it("does not duplicate explain-this-view guidance for risk exceptions", () => {
    expect(routeViewExplanationForPathname("/governance/risk-exceptions")).toBeNull();
  });

  it("revokes after confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));

    render(<RiskExceptionsClient />);
    await screen.findAllByRole("button", { name: "Revoke" });

    fireEvent.click(screen.getAllByRole("button", { name: "Revoke" })[0]);

    await waitFor(() => {
      expect(governanceApi.revokeRiskException).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });
});
