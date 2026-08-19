"use client";

import { useEffect, type ReactElement, type ReactNode } from "react";

import {
  recordShowcaseViewed,
  resolveShowcaseScenarioSlug,
  type ShowcaseRenderMode,
} from "@/lib/marketing/showcase-telemetry";

type ShowcasePageTelemetryProps = {
  readonly runId: string;
  readonly renderMode: ShowcaseRenderMode;
  readonly children: ReactNode;
};

/** Fires showcase_viewed once on mount when marketing analytics consent allows (TB-891 / TB-978). */
export function ShowcasePageTelemetry({
  runId,
  renderMode,
  children,
}: ShowcasePageTelemetryProps): ReactElement {
  useEffect(() => {
    recordShowcaseViewed({
      scenario: resolveShowcaseScenarioSlug(runId),
      renderMode,
    });
  }, [runId, renderMode]);

  return <>{children}</>;
}
