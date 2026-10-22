"use client";

import { Suspense } from "react";

import {
  RunsDashboardPanelClient,
  type RunsDashboardPanelClientProps,
} from "@/components/operator-home/RunsDashboardPanelClient";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunsDashboardPanelProps = RunsDashboardPanelClientProps;

/** Thin client entry for the home runs dashboard (TB-564). */
export function RunsDashboardPanel(props: RunsDashboardPanelProps = {}) {
  return (
    <Suspense
      fallback={
        <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)} data-testid="runs-dashboard-suspense-fallback">
          Loading reviews…
        </p>
      }
    >
      <RunsDashboardPanelClient hideHeading={props.hideHeading} initialModel={props.initialModel ?? null} />
    </Suspense>
  );
}
