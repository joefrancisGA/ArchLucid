import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isOperatorExperienceFullShellEnv: (): boolean => false,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  defaultRiskExceptionExpiresAtUtc: vi.fn(() => "2099-01-01T00:00:00.000Z"),
  listRiskExceptions: vi.fn(),
  renewRiskException: vi.fn(),
  revokeRiskException: vi.fn(),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: null,
    contextHints: {},
    callerAuthorityRank: 0,
    showExtended: true,
    showAdvanced: true,
    mounted: true,
  }),
}));

import * as governanceApi from "@/lib/api/governance-stickiness-api";
import {
  RISK_EXCEPTIONS_CLAIM_DISCIPLINE,
  RISK_EXCEPTIONS_FOLLOW_UPS_TITLE,
} from "@/lib/risk-exceptions-evidence-copy";
import {
  GOVERNANCE_RISK_EXCEPTIONS_BUYER_START_HERE_HELPER,
  GOVERNANCE_RISK_EXCEPTIONS_PAGE_LEAD,
  GOVERNANCE_RISK_EXCEPTIONS_PRIMARY_CONTENT_ID,
  GOVERNANCE_RISK_EXCEPTIONS_SKIP_LINK_LABEL,
} from "@/lib/governance-risk-exceptions-page-copy";

import {
  RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER,
} from "@/app/(operator)/governance/exceptions/risk-exceptions-page-copy";
import RiskExceptionsClient from "@/components/governance/RiskExceptionsClient";

const mockedListRiskExceptions = vi.mocked(governanceApi.listRiskExceptions);

describe("RiskExceptionsClient buyer-polished shell (GRO)", () => {
  beforeEach(() => {
    mockedListRiskExceptions.mockReset();
    mockedListRiskExceptions.mockResolvedValue([]);
  });

  it("renders skip link, buyer subtitle, first-viewport intro, and orientation after register body", async () => {
    render(<RiskExceptionsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("risk-exceptions-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: GOVERNANCE_RISK_EXCEPTIONS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_RISK_EXCEPTIONS_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("risk-exceptions-claim-discipline").textContent).toContain(
      RISK_EXCEPTIONS_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByText(RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByTestId("governance-risk-exceptions-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("governance-risk-exceptions-intro")).toHaveTextContent(
      GOVERNANCE_RISK_EXCEPTIONS_PAGE_LEAD,
    );
    expect(screen.getByTestId("governance-risk-exceptions-buyer-start-here-helper")).toHaveTextContent(
      GOVERNANCE_RISK_EXCEPTIONS_BUYER_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: RISK_EXCEPTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("risk-exceptions-findings-vocabulary")).not.toBeInTheDocument();

    const primary = screen.getByTestId("governance-risk-exceptions-primary-content");
    const orientation = screen.getByTestId("risk-exceptions-orientation-bottom");
    const emptyState = screen.getByTestId("risk-exceptions-empty-state");

    expect(primary).toContainElement(orientation);
    expect(emptyState.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
