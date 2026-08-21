import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — alert rules hub tab deferred chunk catalog. */
export const ALERT_RULES_HUB_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "alert-rules-hub-conditions",
    label: "Loading alert conditions",
    variant: "panel",
    modulePath: "@/components/alerts/AlertRulesContent",
    exportName: "AlertRulesContent",
  },
  {
    id: "alert-rules-hub-routing",
    label: "Loading alert notifications",
    variant: "panel",
    modulePath: "@/components/alerts/AlertRoutingContent",
    exportName: "AlertRoutingContent",
  },
  {
    id: "alert-rules-hub-composite-rules",
    label: "Loading advanced alert rules",
    variant: "panel",
    modulePath: "@/components/alerts/CompositeAlertRulesContent",
    exportName: "CompositeAlertRulesContent",
  },
  {
    id: "alert-rules-hub-simulation-tuning",
    label: "Loading alert simulation",
    variant: "panel",
    modulePath: "@/components/alerts/AlertSimulationTuningSection",
    exportName: "AlertSimulationTuningSection",
  },
] as const;
