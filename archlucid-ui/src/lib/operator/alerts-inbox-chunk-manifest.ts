import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — alerts inbox deferred chunk catalog. */
export const ALERTS_INBOX_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "alerts-inbox-governance-context-panel",
    label: "Loading alerts context",
    variant: "context",
    modulePath: "@/components/alerts/AlertsGovernanceContextPanel",
    exportName: "AlertsGovernanceContextPanel",
  },
] as const;
