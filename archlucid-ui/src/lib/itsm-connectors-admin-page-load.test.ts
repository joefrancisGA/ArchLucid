import { describe, expect, it } from "vitest";

import {
  buildItsmConnectorsAdminPageLoadResult,
  resolveItsmAdminJiraCredentialsConfigured,
  resolveItsmAdminServiceNowCredentialsConfigured,
  settleItsmConnectorsAdminPageLoadSlice,
} from "@/lib/itsm-connectors-admin-page-load";

describe("itsm-connectors-admin-page-load", () => {
  it("keeps fulfilled values and marks rejected slices failed", () => {
    const settled = settleItsmConnectorsAdminPageLoadSlice(
      { status: "fulfilled", value: { nativeEnabled: true } },
      "health",
    );

    expect(settled.value).toEqual({ nativeEnabled: true });
    expect(settled.failed).toBe(false);
    expect(settled.errorMessage).toBeNull();
  });

  it("maps rejected reasons to slice error messages", () => {
    const settled = settleItsmConnectorsAdminPageLoadSlice(
      { status: "rejected", reason: new Error("Database Query Failed") },
      "settings",
    );

    expect(settled.value).toBeNull();
    expect(settled.failed).toBe(true);
    expect(settled.errorMessage).toBe("Database Query Failed");
  });

  it("builds a partial load where settings fail without clearing health (TB-1431)", () => {
    const result = buildItsmConnectorsAdminPageLoadResult({
      health: {
        status: "fulfilled",
        value: {
          nativeEnabled: true,
          jira: { locallyConfigured: true, reachable: true, summary: "ready" },
          serviceNow: { locallyConfigured: false, summary: "missing" },
        },
      },
      settings: { status: "rejected", reason: new Error("Database Query Failed") },
    });

    expect(result.health.value?.jira?.summary).toBe("ready");
    expect(result.settings.value).toBeNull();
    expect(result.settings.failed).toBe(true);
    expect(result.failedSliceLabels).toEqual(["ITSM connector settings"]);
    expect(result.loadError).toBe("Database Query Failed");
  });

  it("builds a partial load where health fails without clearing settings (TB-1431)", () => {
    const result = buildItsmConnectorsAdminPageLoadResult({
      health: { status: "rejected", reason: new Error("Health probe unavailable") },
      settings: {
        status: "fulfilled",
        value: {
          hasTenantOverrides: true,
          nativeEnabled: true,
          deploymentCredentials: {
            jiraConfigured: true,
            serviceNowConfigured: false,
          },
        },
      },
    });

    expect(result.health.failed).toBe(true);
    expect(result.settings.value?.hasTenantOverrides).toBe(true);
    expect(result.failedSliceLabels).toEqual(["ITSM connector health"]);
    expect(result.loadError).toBe("Health probe unavailable");
  });

  it("falls back to health probes for credential status when settings load failed (TB-1431)", () => {
    expect(
      resolveItsmAdminJiraCredentialsConfigured(
        null,
        {
          nativeEnabled: true,
          jira: { locallyConfigured: true, reachable: true, summary: "ready" },
        },
        true,
      ),
    ).toBe(true);

    expect(
      resolveItsmAdminServiceNowCredentialsConfigured(
        null,
        {
          nativeEnabled: true,
          serviceNow: { locallyConfigured: false, summary: "missing" },
        },
        true,
      ),
    ).toBe(false);
  });
});
