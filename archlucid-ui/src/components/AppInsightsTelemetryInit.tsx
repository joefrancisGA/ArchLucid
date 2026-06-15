"use client";

import { useEffect } from "react";

import { getAppInsights } from "@/lib/telemetry";

/** Loads Application Insights once per operator shell session when connection string is configured. */
export function AppInsightsTelemetryInit() {
  useEffect(() => {
    getAppInsights();
  }, []);

  return null;
}
