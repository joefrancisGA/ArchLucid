import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExecDigestPreferencesResponse, ExecDigestPreferencesUpsertRequest } from "@/types/exec-digest-preferences";

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    currentPrincipal: {
      provenance: "auth-me" as const,
      name: "Test User",
      roleClaimValues: ["Operator"],
      primaryAppRole: "Operator" as const,
      maxAuthority: "ExecuteAuthority" as const,
      authorityRank: 2,
      hasEnterpriseOperatorSurfaces: true,
      hasCommittedArchitectureReview: true,
      permissionClaimValues: [],
    },
    callerAuthorityRank: 2,
    isAuthorityLoading: false,
  }),
}));

const hoisted = vi.hoisted(() => {
  const digestLoad: ExecDigestPreferencesResponse = {
    schemaVersion: 1,
    tenantId: "t1",
    isConfigured: true,
    emailEnabled: false,
    recipientEmails: ["a@example.com"],
    ianaTimeZoneId: "Etc/UTC",
    dayOfWeek: 1,
    hourOfDay: 9,
    updatedUtc: "2026-01-01T00:00:00Z",
  };

  const saveExecDigestMock = vi.fn(async (body: ExecDigestPreferencesUpsertRequest): Promise<ExecDigestPreferencesResponse> => {
    return { ...digestLoad, ...body, updatedUtc: "2026-01-02T00:00:00Z" };
  });

  return { digestLoad, saveExecDigestMock };
});

vi.mock("./_sections/load-tenant-settings-page-data", () => ({
  loadTenantSettingsPageData: () =>
    Promise.resolve({
      mode: "visible" as const,
      trial: { status: "Active", daysRemaining: 7 },
      digest: hoisted.digestLoad,
      digestLoadFailure: null,
    }),
}));

vi.mock("@/lib/api", () => ({
  getExecDigestPreferences: vi.fn(() => Promise.resolve(hoisted.digestLoad)),
  tryGetTenantTrialStatus: vi.fn(() => Promise.resolve({ status: "Active", daysRemaining: 7 })),
  saveExecDigestPreferences: (b: ExecDigestPreferencesUpsertRequest) => hoisted.saveExecDigestMock(b),
}));

import TenantSettingsPage from "./page";

describe("TenantSettingsPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/v1/tenant/cost-settings")) {
          return new Response(
            JSON.stringify({
              architectHourlyRateUsd: 150,
              averageIncidentCostUsd: 25000,
              eaDiscountMultiplier: 1,
              eaDiscountPercentage: 0,
              isTenantConfigured: false,
              updatedUtc: null,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response("{}", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders and saves digest preferences", async () => {
    const page = await TenantSettingsPage();

    render(page);
    expect(await screen.findByTestId("tenant-settings-page")).toBeInTheDocument();
    expect(await screen.findByText(/Status:/i)).toBeInTheDocument();
    const save = await screen.findByTestId("tenant-digest-save");
    fireEvent.click(save);

    await waitFor(() => {
      expect(hoisted.saveExecDigestMock).toHaveBeenCalled();
    });
  });
});
