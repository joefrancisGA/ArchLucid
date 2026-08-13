import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";
import { invalidateTenantTrialStatusCache } from "@/lib/tenant-trial-status-client";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";

import { TrialUsageUpgradeNudge } from "@/components/trial/TrialUsageUpgradeNudge";

vi.mock("@/lib/auth-config", () => ({
  AUTH_MODE: "development-bypass",
}));

vi.mock("@/lib/oidc/config", () => ({
  isJwtAuthMode: () => false,
}));

vi.mock("@/lib/oidc/session", () => ({
  isLikelySignedIn: () => false,
}));

function createFetchMock(trialStatusPayload: Record<string, unknown>): ReturnType<typeof vi.fn> {
  return vi.fn(async (url: string) => {
    if (url.includes("/v1/tenant/trial-status")) {
      return new Response(JSON.stringify(trialStatusPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  });
}

describe("TrialUsageUpgradeNudge telemetry wiring", () => {
  beforeEach(async () => {
    buyerPolishedShellVitestOverride.value = false;
    resetOperatorQueryClientForTests();
    await invalidateTenantTrialStatusCache();
    vi.stubEnv("NEXT_PUBLIC_OPERATOR_EXPERIENCE", "operator");
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    buyerPolishedShellVitestOverride.value = null;
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("fires POST /v1/diagnostics/trial-upgrade-nudge/shown and /clicked with trigger context", async () => {
    const fetchMock = createFetchMock({
      status: "Active",
      daysRemaining: 20,
      trialRunsUsed: 8,
      trialRunsLimit: 10,
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithOperatorQuery(<TrialUsageUpgradeNudge />);

    await waitFor(() => {
      expect(screen.getByTestId("trial-usage-upgrade-nudge")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/trial-upgrade-nudge/shown",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ trigger: "runs" }),
      }),
    );

    fetchMock.mockClear();

    fireEvent.click(screen.getByTestId("trial-upgrade-nudge-cta"));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/v1/diagnostics/trial-upgrade-nudge/clicked",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ trigger: "runs" }),
      }),
    );
  });
});
