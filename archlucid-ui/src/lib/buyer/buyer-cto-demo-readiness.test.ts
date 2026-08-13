import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deriveBuyerCtoDemoReadinessVerdict,
  evaluateBuyerCtoDemoAuthCheck,
  evaluateBuyerCtoDemoJourneyRoutesCheck,
  evaluateBuyerCtoDemoReadiness,
  evaluateBuyerCtoDemoShellCheck,
} from "@/lib/buyer/buyer-cto-demo-readiness";

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

vi.mock("@/lib/cto-demo-presenter-pack", () => ({
  isCtoDemoOperatorToolingEnv: vi.fn(() => false),
}));

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: vi.fn(() => false),
  isShowcaseSpineStaticPayloadActiveForRun: vi.fn(() => true),
  tryStaticDemoManifestSummary: vi.fn(() => ({ status: "committed" })),
  tryStaticDemoProvenanceGraph: vi.fn(() => null),
  tryStaticDemoGovernanceApprovalRequests: vi.fn(() => null),
  areSpineStaticDemoPayloadsAvailable: vi.fn(() => false),
}));

import { getRunSummary } from "@/lib/api";
import { getBearerToken } from "@/lib/api/http";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import * as demoUiEnv from "@/lib/demo-ui-env";
import { isCtoDemoOperatorToolingEnv } from "@/lib/cto-demo-presenter-pack";
import {
  isShowcaseSpineStaticPayloadActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
  tryStaticDemoManifestSummary,
} from "@/lib/operator/operator-static-demo";
import { TRIAL_ONBOARDING_SAMPLE_RUN_ID } from "@/lib/trial-sample-run";
import {
  BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_API_MISSING,
  BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
  BUYER_DEMO_READINESS_SAMPLE_UNAVAILABLE_DETAIL,
} from "@/lib/buyer/buyer-polish-copy";

const mockGetRunSummary = vi.mocked(getRunSummary);
const mockFetchHealthReadySummary = vi.mocked(fetchHealthReadySummary);
const mockGetBearerToken = vi.mocked(getBearerToken);
const mockIsCtoDemoOperatorToolingEnv = vi.mocked(isCtoDemoOperatorToolingEnv);
const mockIsShowcaseSpineStaticPayloadActiveForRun = vi.mocked(isShowcaseSpineStaticPayloadActiveForRun);
const mockTryStaticDemoManifestSummary = vi.mocked(tryStaticDemoManifestSummary);

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
    mockIsCtoDemoOperatorToolingEnv.mockReturnValue(false);
    mockIsShowcaseSpineStaticPayloadActiveForRun.mockReturnValue(true);
    mockTryStaticDemoManifestSummary.mockReturnValue({ status: "committed" } as never);
    vi.mocked(demoUiEnv.isNextPublicDemoMode).mockReturnValue(true);
  });

  it("returns ready when showcase static spine is available and API health responds", async () => {
    mockGetRunSummary.mockResolvedValue({
      runId: TRIAL_ONBOARDING_SAMPLE_RUN_ID,
      projectId: "default",
      createdUtc: "2026-01-10T09:15:22.000Z",
      hasGoldenManifest: true,
    });
    mockFetchHealthReadySummary.mockResolvedValue({ status: "Healthy", checks: [] });

    const result = await evaluateBuyerCtoDemoReadiness();

    expect(evaluateBuyerCtoDemoShellCheck().status).toBe("pass");
    expect(result.verdict).toBe("ready");
    expect(result.checks.every((check) => check.status === "pass")).toBe(true);
    expect(result.checks.find((check) => check.id === "showcase-committed")?.detail).toBe(
      BUYER_DEMO_READINESS_SAMPLE_READY_DETAIL,
    );
  });

  it("never surfaces demo seed instructions in buyer-facing showcase failures", async () => {
    mockIsShowcaseSpineStaticPayloadActiveForRun.mockReturnValue(false);
    mockTryStaticDemoManifestSummary.mockReturnValue(null);
    mockGetRunSummary.mockRejectedValue(new Error("not found"));
    mockFetchHealthReadySummary.mockResolvedValue({ status: "Healthy", checks: [] });

    const result = await evaluateBuyerCtoDemoReadiness();
    const showcaseCheck = result.checks.find((check) => check.id === "showcase-committed");

    expect(showcaseCheck?.status).toBe("fail");
    expect(showcaseCheck?.detail).toBe(BUYER_DEMO_READINESS_SAMPLE_UNAVAILABLE_DETAIL);
    expect(showcaseCheck?.detail).not.toMatch(/demo seed/i);
    expect(showcaseCheck?.detail).not.toMatch(/static operator/i);
  });

  it("shows operator diagnostics for showcase failures when demo-operator tooling is enabled", async () => {
    mockIsCtoDemoOperatorToolingEnv.mockReturnValue(true);
    mockIsShowcaseSpineStaticPayloadActiveForRun.mockReturnValue(false);
    mockTryStaticDemoManifestSummary.mockReturnValue(null);
    mockGetRunSummary.mockRejectedValue(new Error("not found"));
    mockFetchHealthReadySummary.mockResolvedValue({ status: "Healthy", checks: [] });

    const result = await evaluateBuyerCtoDemoReadiness();
    const showcaseCheck = result.checks.find((check) => check.id === "showcase-committed");

    expect(showcaseCheck?.detail).toBe(BUYER_DEMO_READINESS_OPERATOR_SHOWCASE_API_MISSING);
  });
});
