import { describe, expect, it } from "vitest";

import { buildServiceNowPageLoadResult, settleServiceNowPageLoadSlice } from "@/lib/servicenow-page-load";

describe("servicenow-page-load", () => {
  it("keeps fulfilled values and marks rejected slices failed", () => {
    const settled = settleServiceNowPageLoadSlice(
      { status: "fulfilled", value: { ok: true } },
      "connection",
    );

    expect(settled.value).toEqual({ ok: true });
    expect(settled.failed).toBe(false);
    expect(settled.errorMessage).toBeNull();
  });

  it("maps rejected reasons to slice error messages", () => {
    const settled = settleServiceNowPageLoadSlice(
      { status: "rejected", reason: new Error("Database Query Failed") },
      "settings",
    );

    expect(settled.value).toBeNull();
    expect(settled.failed).toBe(true);
    expect(settled.errorMessage).toBe("Database Query Failed");
  });

  it("builds a partial load where settings fail without clearing connection (TB-1162)", () => {
    const result = buildServiceNowPageLoadResult({
      health: {
        status: "fulfilled",
        value: {
          nativeEnabled: true,
          serviceNow: { locallyConfigured: true, reachable: true, summary: "ready" },
        },
      },
      settings: { status: "rejected", reason: new Error("Database Query Failed") },
      connection: {
        status: "fulfilled",
        value: {
          provider: "servicenow",
          isConfigured: true,
          instanceBaseUrl: "https://example.service-now.com",
          authMode: "BasicApiToken",
        },
      },
    });

    expect(result.connection.value?.instanceBaseUrl).toBe("https://example.service-now.com");
    expect(result.settings.value).toBeNull();
    expect(result.settings.failed).toBe(true);
    expect(result.failedSliceLabels).toEqual(["ServiceNow settings"]);
    expect(result.loadError).toBe("Database Query Failed");
  });
});
