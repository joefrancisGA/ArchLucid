"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function AlertRulesHubTabChunkLoading(props: { readonly label: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        "h-32 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label={props.label}
      data-testid="alert-rules-hub-tab-chunk-loading"
    />
  );
}

/** Conditions tab — default hub panel (still code-split so inactive first paint stays small). */
export const AlertRulesContentDeferred: ComponentType = dynamic(
  () => import("@/components/alerts/AlertRulesContent").then((module) => module.AlertRulesContent),
  {
    ssr: false,
    loading: () => <AlertRulesHubTabChunkLoading label="Loading alert conditions" />,
  },
);

export const AlertRoutingContentDeferred: ComponentType = dynamic(
  () => import("@/components/alerts/AlertRoutingContent").then((module) => module.AlertRoutingContent),
  {
    ssr: false,
    loading: () => <AlertRulesHubTabChunkLoading label="Loading alert notifications" />,
  },
);

export const CompositeAlertRulesContentDeferred: ComponentType = dynamic(
  () =>
    import("@/components/alerts/CompositeAlertRulesContent").then(
      (module) => module.CompositeAlertRulesContent,
    ),
  {
    ssr: false,
    loading: () => <AlertRulesHubTabChunkLoading label="Loading advanced alert rules" />,
  },
);

export const AlertSimulationTuningSectionDeferred: ComponentType = dynamic(
  () =>
    import("@/components/alerts/AlertSimulationTuningSection").then(
      (module) => module.AlertSimulationTuningSection,
    ),
  {
    ssr: false,
    loading: () => <AlertRulesHubTabChunkLoading label="Loading alert simulation" />,
  },
);
