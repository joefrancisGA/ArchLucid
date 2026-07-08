import type { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";

import { normalizeTelemetryRoute } from "./telemetry-route-normalizer";

/** Pilot-scale default — raise or lower when traffic grows (TB-692). */
export const WEB_VITALS_SAMPLE_RATE = 1;

export function resolveWebVitalsTenantTierLabel(): string {
  const cached = getOperatorQueryClient().getQueryData<TeamExpansionNudgeStatusPayload>(
    operatorQueryKeys.tenantUsageStatus,
  );
  const tier = cached?.commercialTier?.trim() ?? "";

  if (tier.length > 0) {
    return tier;
  }

  return "unspecified";
}

function resolveEffectiveConnectionType(): string {
  if (typeof navigator === "undefined") {
    return "unknown";
  }

  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;

  return connection?.effectiveType?.trim() ?? "unknown";
}

function shouldSampleMetric(): boolean {
  if (WEB_VITALS_SAMPLE_RATE >= 1) {
    return true;
  }

  if (WEB_VITALS_SAMPLE_RATE <= 0) {
    return false;
  }

  return Math.random() < WEB_VITALS_SAMPLE_RATE;
}

function reportWebVitalMetric(ai: ApplicationInsights, metric: Metric): void {
  if (!shouldSampleMetric()) {
    return;
  }

  const route = normalizeTelemetryRoute(window.location.pathname);

  ai.trackEvent(
    { name: "WebVitalsMetric" },
    {
      metricName: metric.name,
      value: String(metric.value),
      rating: metric.rating,
      metricId: metric.id,
      route,
      tenantTier: resolveWebVitalsTenantTierLabel(),
      navigationType: metric.navigationType ?? "unknown",
      effectiveConnectionType: resolveEffectiveConnectionType(),
    },
  );
}

/** Registers Core Web Vitals listeners once App Insights is ready (TB-692). */
export function startWebVitalsReporting(ai: ApplicationInsights): void {
  const report = (metric: Metric): void => {
    reportWebVitalMetric(ai, metric);
  };

  onLCP(report);
  onCLS(report);
  onINP(report);
  onTTFB(report);
  onFCP(report);
}
