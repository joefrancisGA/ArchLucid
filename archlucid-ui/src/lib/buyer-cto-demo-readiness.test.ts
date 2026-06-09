import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deriveBuyerCtoDemoReadinessVerdict,
  evaluateBuyerCtoDemoJourneyRoutesCheck,
  evaluateBuyerCtoDemoReadiness,
  evaluateBuyerCtoDemoShellCheck,
} from "@/lib/buyer-cto-demo-readiness";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
  isNextPublicDemoMode: () => true,
}));

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
}));

import { getRunSummary } from "@/lib/api";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";

const mockGetRunSummary = vi.mocked(getRunSummary);
const mockFetchHealthReadySummary = vi.mocked(fetchHealthReadySummary);

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

describe("evaluateBuyerCtoDemoReadiness", () => {
  beforeEach(() => {
    mockGetRunSummary.mockReset();
    mockFetchHealthReadySummary.mockReset();
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
