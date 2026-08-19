import { describe, expect, it } from "vitest";

import { buildJiraPageLoadResult, settleJiraPageLoadSlice } from "@/lib/jira-page-load";

describe("jira-page-load", () => {
  it("keeps fulfilled values and marks rejected slices failed", () => {
    const settled = settleJiraPageLoadSlice({ status: "fulfilled", value: { ok: true } }, "connection");

    expect(settled.value).toEqual({ ok: true });
    expect(settled.failed).toBe(false);
    expect(settled.errorMessage).toBeNull();
  });

  it("maps rejected reasons to slice error messages", () => {
    const settled = settleJiraPageLoadSlice(
      { status: "rejected", reason: new Error("Database Query Failed") },
      "settings",
    );

    expect(settled.value).toBeNull();
    expect(settled.failed).toBe(true);
    expect(settled.errorMessage).toBe("Database Query Failed");
  });

  it("builds a partial load where settings fail without clearing connection (TB-1162)", () => {
    const result = buildJiraPageLoadResult({
      health: {
        status: "fulfilled",
        value: {
          nativeEnabled: true,
          jira: { locallyConfigured: true, reachable: true, summary: "ready" },
        },
      },
      settings: { status: "rejected", reason: new Error("Database Query Failed") },
      connection: {
        status: "fulfilled",
        value: {
          provider: "jira",
          isConfigured: true,
          instanceBaseUrl: "https://example.atlassian.net",
          authMode: "OAuth2RefreshToken",
        },
      },
    });

    expect(result.connection.value?.instanceBaseUrl).toBe("https://example.atlassian.net");
    expect(result.settings.value).toBeNull();
    expect(result.settings.failed).toBe(true);
    expect(result.failedSliceLabels).toEqual(["Jira settings"]);
    expect(result.loadError).toBe("Database Query Failed");
  });
});
