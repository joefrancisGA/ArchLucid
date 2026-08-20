import type { DeferredChunkLoadingVariant } from "@/components/ui/deferred-chunk-loading";

import { GOVERNANCE_WORKFLOW_CHUNK_MANIFEST } from "@/lib/operator/governance-workflow-chunk-manifest";
import { OPERATOR_HOME_CHUNK_MANIFEST } from "@/lib/operator/operator-home-chunk-manifest";
import { REVIEWS_HUB_CHUNK_MANIFEST } from "@/lib/operator/reviews-hub-chunk-manifest";
import { RUN_DETAIL_CHUNK_MANIFEST } from "@/lib/operator/run-detail-chunk-manifest";

export type DeferredChunkManifestEntry = {
  readonly id: string;
  readonly label: string;
  readonly variant: DeferredChunkLoadingVariant;
  readonly modulePath: string;
  readonly exportName: string;
};

const SHARED_DEFERRED_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "operator-shell-top-bar",
    label: "Loading shell navigation",
    variant: "compact",
    modulePath: "@/components/shell/OperatorShellTopBar",
    exportName: "OperatorShellTopBar",
  },
] as const;

/** Route-level deferred chunk catalog for TB-2371 manifest + import tests. */
export const DEFERRED_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  ...SHARED_DEFERRED_CHUNK_MANIFEST,
  ...OPERATOR_HOME_CHUNK_MANIFEST,
  ...REVIEWS_HUB_CHUNK_MANIFEST,
  ...RUN_DETAIL_CHUNK_MANIFEST,
  ...GOVERNANCE_WORKFLOW_CHUNK_MANIFEST,
] as const;

export function deferredChunkManifestEntry(id: string): DeferredChunkManifestEntry | undefined {
  return DEFERRED_CHUNK_MANIFEST.find((entry) => entry.id === id);
}
