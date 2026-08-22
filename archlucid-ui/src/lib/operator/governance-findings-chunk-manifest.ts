import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — governance findings queue deferred chunk catalog. */
export const GOVERNANCE_FINDINGS_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "governance-findings-queue-client",
    label: "Loading findings queue",
    variant: "section",
    modulePath: "@/app/(operator)/governance/findings/GovernanceFindingsQueueClient",
    exportName: "default",
  },
] as const;
