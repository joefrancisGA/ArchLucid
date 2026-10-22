"use client";

import type { FirstWeekRouteGuidanceProps } from "@/components/FirstWeekRouteGuidance";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";

import { RunDetailFirstWeekRouteGuidanceDeferred } from "./run-detail-page-view-deferred-chunks";

/** Guided / eval review-detail only — Working desk omits first-week theater (CD-13). */
export function RunDetailFirstWeekRouteGuidanceMount(
  props: FirstWeekRouteGuidanceProps,
): React.JSX.Element | null {
  const evalChrome = useProductionEvalChrome();

  if (!evalChrome) {
    return null;
  }

  return <RunDetailFirstWeekRouteGuidanceDeferred {...props} />;
}
