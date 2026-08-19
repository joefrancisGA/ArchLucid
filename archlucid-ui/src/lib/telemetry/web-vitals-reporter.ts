import type { ApplicationInsights } from "@microsoft/applicationinsights-web";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";

import { normalizeTelemetryRoute } from "./telemetry-route-normalizer";
import {
  DEFAULT_WEB_VITALS_SAMPLE_RATE,
  resolveWebVitalsSampleRate,
} from "./web-vitals-sample-rate";

/** Resolved at module load — override via NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE (TB-2031). */
export const WEB_VITALS_SAMPLE_RATE = resolveWebVitalsSampleRate();

export { DEFAULT_WEB_VITALS_SAMPLE_RATE, resolveWebVitalsSampleRate };

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

/** Session-stable sample decision so LCP/INP/CLS from one page view stay together. */
let sessionSampleDecision: boolean | null = null;

export function resetWebVitalsSessionSampleDecisionForTests(): void {
  sessionSampleDecision = null;
}

function shouldSampleSession(sampleRate: number = WEB_VITALS_SAMPLE_RATE): boolean {
  if (sessionSampleDecision !== null) {
    return sessionSampleDecision;
  }

  if (sampleRate >= 1) {
    sessionSampleDecision = true;
    return true;
  }

  if (sampleRate <= 0) {
    sessionSampleDecision = false;
    return false;
  }

  sessionSampleDecision = Math.random() < sampleRate;
  return sessionSampleDecision;
}

function reportWebVitalMetric(ai: ApplicationInsights, metric: Metric): void {
  if (!shouldSampleSession()) {
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
      sampleRate: String(WEB_VITALS_SAMPLE_RATE),
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
