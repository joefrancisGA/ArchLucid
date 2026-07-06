import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deriveBuyerCtoDemoReadinessVerdict,
  evaluateBuyerCtoDemoAuthCheck,
  evaluateBuyerCtoDemoJourneyRoutesCheck,
  evaluateBuyerCtoDemoReadiness,
  evaluateBuyerCtoDemoShellCheck,
} from "@/lib/buyer-cto-demo-readiness";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: vi.fn(() => true),
  isNextPublicDemoMode: vi.fn(() => true),
};
});

vi.mock("@/lib/api", () => ({
  getRunSummary: vi.fn(),
}));

vi.mock("@/lib/api/http", () => ({
  getBearerToken: vi.fn(() => "demo-token"),
}));

vi.mock("@/lib/llm-monthly-budget-status", () => ({
  fetchLlmMonthlyDollarBudgetStatusCached: vi.fn(async () => ({
    blocksAdditionalLlmExecution: false,
    monthlyBudgetMonitoringActive: true,
    utcMonth: "2026-06",
    hardCutoffUsdPerUtcMonth: 100,
    effectiveHardCapUsd: 100,
    purchasedCapBumpUsd: 0,
    estimatedUsdPressure: 10,
    assumedNextCallReservationUsd: 1,
    hardCapUtilizationFraction: 0.1,
    warnFraction: 0.75,
  })),
}));

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(),
}));

vi.mock("@/lib/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: vi.fn(() => false),
  tryStaticDemoManifestSummary: vi.fn(() => null),
  tryStaticDemoRunDetail: vi.fn(() => null),
  tryStaticDemoProvenanceGraph: vi.fn(() => null),
  tryStaticDemoGovernanceApprovalRequests: vi.fn(() => null),
  areSpineStaticDemoPayloadsAvailable: vi.fn(() => false),
}));

import { getRunSummary } from "@/lib/api";
import { getBearerToken } from "@/lib/api/http";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import * as demoUiEnv from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

const mockGetRunSummary = vi.mocked(getRunSummary);
const mockFetchHealthReadySummary = vi.mocked(fetchHealthReadySummary);
const mockGetBearerToken = vi.mocked(getBearerToken);

function buildJwt(expSeconds: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "demo", exp: expSeconds })).toString("base64url");

  return `${header}.${payload}.sig`;
}

describe("evaluateBuyerCtoDemoJourneyRoutesCheck", () => {
  it("passes when all five golden journey routes resolve", () => {
    expect(evaluateBuyerCtoDemoJourneyRoutesCheck().status).toBe("pass");
  });
});

describe("deriveBuyerCtoDemoReadinessVerdict", () => {
  it("returns ready when every check passes", () => {
    expect(
      deriveBuyerCtoDemoReadinessVerdict([
        { id: "buyer-shell", label: "Shell", status: "pass", detail: "" },
        { id: "journey-routes", label: "Routes", status: "pass", detail: "" },
      ]),
    ).toBe("ready");
  });

  it("returns not-ready when any check fails", () => {
    expect(
      deriveBuyerCtoDemoReadinessVerdict([
        { id: "buyer-shell", label: "Shell", status: "pass", detail: "" },
        { id: "api-ready", label: "API", status: "fail", detail: "" },
      ]),
    ).toBe("not-ready");
  });
});

describe("evaluateBuyerCtoDemoAuthCheck", () => {
  beforeEach(() => {
    vi.mocked(demoUiEnv.isNextPublicDemoMode).mockReturnValue(false);
    vi.mocked(isStaticDemoPayloadFallbackEnabled).mockReturnValue(false);
  });

  it("fails when bearer token is expired", () => {
    mockGetBearerToken.mockReturnValue(buildJwt(Math.floor(Date.now() / 1000) - 60));

    expect(evaluateBuyerCtoDemoAuthCheck().status).toBe("fail");
  });

  it("warns when bearer token expires before demo minimum", () => {
    mockGetBearerToken.mockReturnValue(buildJwt(Math.floor(Date.now() / 1000) + 20 * 60));

    expect(evaluateBuyerCtoDemoAuthCheck().status).toBe("warn");
  });

  it("passes when bearer token has sufficient lifetime", () => {
    mockGetBearerToken.mockReturnValue(buildJwt(Math.floor(Date.now() / 1000) + 60 * 60));

    expect(evaluateBuyerCtoDemoAuthCheck().status).toBe("pass");
  });
});

describe("evaluateBuyerCtoDemoReadiness", () => {
  beforeEach(() => {
    mockGetRunSummary.mockReset();
    mockFetchHealthReadySummary.mockReset();
    vi.mocked(demoUiEnv.isNextPublicDemoMode).mockReturnValue(true);
  });

  it("returns ready when showcase is committed and API health responds", async () => {
    mockGetRunSummary.mockResolvedValue({
      runId: "claims-intake-modernization",
      projectId: "default",
      createdUtc: "2026-01-10T09:15:22.000Z",
      hasGoldenManifest: true,
    });
    mockFetchHealthReadySummary.mockResolvedValue({ status: "Healthy", checks: [] });

    const result = await evaluateBuyerCtoDemoReadiness();

    expect(evaluateBuyerCtoDemoShellCheck().status).toBe("pass");
    expect(result.verdict).toBe("ready");
    expect(result.checks.every((check) => check.status === "pass")).toBe(true);
  });
});
