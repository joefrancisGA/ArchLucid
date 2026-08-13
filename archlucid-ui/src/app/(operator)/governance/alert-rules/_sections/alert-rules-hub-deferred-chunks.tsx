"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

function alertRulesHubTabChunkLoading(label: string): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      variant="panel"
      testId="alert-rules-hub-tab-chunk-loading"
    />
  );
}

/** Conditions tab — default hub panel (still code-split so inactive first paint stays small). */
export const AlertRulesContentDeferred: ComponentType = dynamic(
  () => import("@/components/alerts/AlertRulesContent").then((module) => module.AlertRulesContent),
  {
    ssr: false,
    loading: () => alertRulesHubTabChunkLoading("Loading alert conditions"),
  },
);

export const AlertRoutingContentDeferred: ComponentType = dynamic(
  () => import("@/components/alerts/AlertRoutingContent").then((module) => module.AlertRoutingContent),
  {
    ssr: false,
    loading: () => alertRulesHubTabChunkLoading("Loading alert notifications"),
  },
);

export const CompositeAlertRulesContentDeferred: ComponentType = dynamic(
  () =>
    import("@/components/alerts/CompositeAlertRulesContent").then(
      (module) => module.CompositeAlertRulesContent,
    ),
  {
    ssr: false,
    loading: () => alertRulesHubTabChunkLoading("Loading advanced alert rules"),
  },
);

export const AlertSimulationTuningSectionDeferred: ComponentType = dynamic(
  () =>
    import("@/components/alerts/AlertSimulationTuningSection").then(
      (module) => module.AlertSimulationTuningSection,
    ),
  {
    ssr: false,
    loading: () => alertRulesHubTabChunkLoading("Loading alert simulation"),
  },
);
