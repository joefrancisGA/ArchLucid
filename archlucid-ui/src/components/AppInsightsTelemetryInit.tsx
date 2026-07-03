"use client";

import { useEffect } from "react";

import { scheduleDeferredAppInsightsInit } from "@/lib/telemetry/app-insights-init-scheduler";
import { ensureAppInsights } from "@/lib/telemetry";

/** Loads Application Insights once per operator shell session when connection string is configured. */
export function AppInsightsTelemetryInit() {
  useEffect(
    () =>
      scheduleDeferredAppInsightsInit(() => {
        void ensureAppInsights();
      }),
    [],
  );

  return null;
}
