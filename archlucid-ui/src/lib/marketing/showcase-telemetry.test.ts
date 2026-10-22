import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MARKETING_ANALYTICS_CONSENT_STORAGE_KEY } from "@/lib/marketing-analytics-consent";

import {
  recordShowcaseFunnelEvent,
  recordShowcaseViewed,
  resolveShowcaseScenarioSlug,
} from "./showcase-telemetry";

vi.mock("@/lib/telemetry", () => ({
  ensureAppInsights: vi.fn().mockResolvedValue({
    trackEvent: vi.fn(),
  }),
}));

describe("showcase-telemetry", () => {
  let clarity: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clarity = vi.fn();
    (window as Window & { clarity?: typeof clarity }).clarity = clarity;
    window.localStorage.setItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY, "granted");
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_MARKETING_ANALYTICS_DISABLED", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.removeItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY);
    delete (window as Window & { clarity?: typeof clarity }).clarity;
  });

  it("resolveShowcaseScenarioSlug decodes route segment", () => {
    expect(resolveShowcaseScenarioSlug("claims-intake-modernization")).toBe("claims-intake-modernization");
  });

  it("recordShowcaseViewed sets scenario + render mode and emits showcase_viewed", () => {
    recordShowcaseViewed({ scenario: "claims-intake-modernization", renderMode: "static" });

    expect(clarity.mock.calls).toContainEqual(["set", "showcase_scenario", "claims-intake-modernization"]);
    expect(clarity.mock.calls).toContainEqual(["set", "showcase_render_mode", "static"]);
    expect(clarity.mock.calls).toContainEqual(["event", "showcase_viewed"]);
  });

  it("recordShowcaseFunnelEvent emits companion event names", () => {
    recordShowcaseFunnelEvent("quick_nav_finding", {
      scenario: "claims-intake-modernization",
      renderMode: "api",
    });

    expect(clarity.mock.calls).toContainEqual(["event", "showcase_quick_nav_finding"]);
  });

  it("is a no-op when marketing analytics kill switch is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_ARCHLUCID_MARKETING_ANALYTICS_DISABLED", "true");

    recordShowcaseViewed({ scenario: "claims-intake-modernization", renderMode: "static" });

    expect(clarity).not.toHaveBeenCalled();
  });

  it("is a no-op when consent is not granted", () => {
    window.localStorage.removeItem(MARKETING_ANALYTICS_CONSENT_STORAGE_KEY);

    recordShowcaseViewed({ scenario: "claims-intake-modernization", renderMode: "static" });

    expect(clarity).not.toHaveBeenCalled();
  });
});
