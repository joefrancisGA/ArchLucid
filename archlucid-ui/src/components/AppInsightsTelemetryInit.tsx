"use client";

import { useEffect } from "react";

import { ensureAppInsights } from "@/lib/telemetry";

function scheduleAppInsightsInit(): () => void {
  const init = (): void => {
    void ensureAppInsights();
  };

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(init);

    return () => {
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = window.setTimeout(init, 1);

  return () => {
    window.clearTimeout(timeoutId);
  };
}

/** Loads Application Insights once per operator shell session when connection string is configured. */
export function AppInsightsTelemetryInit() {
  useEffect(() => scheduleAppInsightsInit(), []);

  return null;
}
