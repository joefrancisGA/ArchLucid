import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

import RiskExceptionsClient from "@/components/governance/RiskExceptionsClient";
import * as governanceApi from "@/lib/api/governance-stickiness-api";
import { BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION } from "@/lib/buyer/buyer-polish-copy";
import { RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER } from "@/app/(operator)/governance/exceptions/risk-exceptions-page-copy";
import { routeViewExplanationForPathname } from "@/lib/usability/route-view-explanations";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

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
      useWhen: "Use this page to track owner, expiration, evidence, and the linked decision.",
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
    vi.clearAllMocks();

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
        expiresAtUtc: laterExpiry,
        status: "Active",
      },
    ]);
    vi.mocked(governanceApi.revokeRiskException).mockResolvedValue(undefined);
  });

  it("shows expiring-soon warning when waivers expire within 30 days", async () => {
    render(<RiskExceptionsClient />);

    expect(await screen.findByTestId("risk-exceptions-expiring-warning")).toBeInTheDocument();
  });

  it("renders empty state with create architecture CTA", async () => {
    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([]);

    render(<RiskExceptionsClient />);

    expect(await screen.findByTestId("risk-exceptions-empty-state")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CREATE_ARCHITECTURE_LABEL })).toBeInTheDocument();
  });

  it("renders layer guidance outside buyer shell", async () => {
    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([]);

    render(<RiskExceptionsClient />);

    expect(
      await screen.findByText("Track active waivers, expirations, owners, and linked governance decisions."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Submit finalized architecture outputs for governance review and promotion."),
    ).not.toBeInTheDocument();
  });

  it("renders buyer chrome instead of layer guidance in buyer shell", async () => {
    demoUiEnvMock.buyerPolishedShell = true;
    vi.mocked(governanceApi.listRiskExceptions).mockResolvedValue([]);

    render(<RiskExceptionsClient />);

    expect(await screen.findByTestId("risk-exceptions-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("risk-exceptions-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(
      screen.queryByText("Track active waivers, expirations, owners, and linked governance decisions."),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("risk-exceptions-findings-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION })).toHaveAttribute(
      "href",
      "/architecture/reviews/new",
    );
  });

  it("does not duplicate explain-this-view guidance for risk exceptions", () => {
    expect(routeViewExplanationForPathname("/governance/exceptions")).toBeNull();
  });

  it("revokes after confirmation", async () => {
    render(<RiskExceptionsClient />);

    fireEvent.click(await screen.findByTestId("risk-exception-revoke-11111111-1111-1111-1111-111111111111"));

    expect(screen.getByRole("heading", { name: /Revoke risk exception/i })).toBeInTheDocument();
    expect(governanceApi.revokeRiskException).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Revoke exception" }));

    await waitFor(() => {
      expect(governanceApi.revokeRiskException).toHaveBeenCalledWith("11111111-1111-1111-1111-111111111111");
    });
  });
});
