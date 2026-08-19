import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
    isNextPublicDemoMode: () => false,
  };
});

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
import { RISK_EXCEPTIONS_CLAIM_DISCIPLINE } from "@/lib/risk-exceptions-evidence-copy";

import {
  RISK_EXCEPTIONS_CLAIM_HEADING,
  RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER,
} from "@/app/(operator)/governance/exceptions/risk-exceptions-page-copy";
import RiskExceptionsClient from "@/components/governance/RiskExceptionsClient";

const mockedListRiskExceptions = vi.mocked(governanceApi.listRiskExceptions);

describe("RiskExceptionsClient buyer-polished shell", () => {
  beforeEach(() => {
    mockedListRiskExceptions.mockReset();
    mockedListRiskExceptions.mockResolvedValue([]);
  });

  it("renders breadcrumb, buyer subtitle, claim strip, and hides vocabulary rail", async () => {
    render(<RiskExceptionsClient />);

    await waitFor(() => {
      expect(screen.getByTestId("risk-exceptions-empty-state")).toBeInTheDocument();
    });

    expect(screen.getByTestId("risk-exceptions-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByText(RISK_EXCEPTIONS_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByText(RISK_EXCEPTIONS_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.queryByTestId("risk-exceptions-findings-vocabulary")).not.toBeInTheDocument();
  });
});
