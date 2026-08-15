import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApplicationInsights } from "@microsoft/applicationinsights-web";

const webVitalsMocks = vi.hoisted(() => ({
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onTTFB: vi.fn(),
}));

vi.mock("web-vitals", () => webVitalsMocks);

vi.mock("@/lib/query/operator-query-client", () => ({
  getOperatorQueryClient: () => ({
    getQueryData: () => ({ commercialTier: "Team" }),
  }),
}));

vi.mock("@/lib/telemetry/web-vitals-sample-rate", async () => {
  const actual = await vi.importActual<typeof import("@/lib/telemetry/web-vitals-sample-rate")>(
    "@/lib/telemetry/web-vitals-sample-rate",
  );

  return {
    ...actual,
    resolveWebVitalsSampleRate: () => 1,
  };
});

import {
  resetWebVitalsSessionSampleDecisionForTests,
  startWebVitalsReporting,
} from "@/lib/telemetry/web-vitals-reporter";

describe("startWebVitalsReporting", () => {
  beforeEach(() => {
    resetWebVitalsSessionSampleDecisionForTests();
    webVitalsMocks.onCLS.mockReset();
    webVitalsMocks.onFCP.mockReset();
    webVitalsMocks.onINP.mockReset();
    webVitalsMocks.onLCP.mockReset();
    webVitalsMocks.onTTFB.mockReset();
  });

  it("registers all Core Web Vitals listeners", async () => {
    const trackEvent = vi.fn();
    const ai = { trackEvent } as unknown as ApplicationInsights;

    await startWebVitalsReporting(ai);

    expect(webVitalsMocks.onLCP).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onCLS).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onINP).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onTTFB).toHaveBeenCalledOnce();
    expect(webVitalsMocks.onFCP).toHaveBeenCalledOnce();
  });

  it("emits App Insights events with normalized route and tenant tier dimensions", async () => {
    const trackEvent = vi.fn();
    const ai = { trackEvent } as unknown as ApplicationInsights;

    vi.stubGlobal("window", {
      location: { pathname: "/architecture/reviews/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" },
    });
    vi.stubGlobal("navigator", { connection: { effectiveType: "4g" } });

    await startWebVitalsReporting(ai);

    const handler = webVitalsMocks.onLCP.mock.calls[0]?.[0] as
      | ((metric: { name: string; value: number; rating: string; id: string; navigationType?: string }) => void)
      | undefined;

    expect(handler).toBeDefined();

    handler?.({
      name: "LCP",
      value: 1800,
      rating: "good",
      id: "v3-123",
      navigationType: "navigate",
    });

    expect(trackEvent).toHaveBeenCalledWith(
      { name: "WebVitalsMetric" },
      expect.objectContaining({
        metricName: "LCP",
        route: "/architecture/reviews/[reviewId]",
        tenantTier: "Team",
        effectiveConnectionType: "4g",
      }),
    );
  });
});
