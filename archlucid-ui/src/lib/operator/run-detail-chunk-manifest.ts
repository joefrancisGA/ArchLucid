import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

import { RUN_DETAIL_CHUNK_MANIFEST_CREATE_HOME } from "./run-detail-chunk-manifest-create-home";
import { RUN_DETAIL_CHUNK_MANIFEST_EXPORTS_SPONSOR } from "./run-detail-chunk-manifest-exports-sponsor";
import { RUN_DETAIL_CHUNK_MANIFEST_FINDINGS_GOVERNANCE } from "./run-detail-chunk-manifest-findings-governance";
import { RUN_DETAIL_CHUNK_MANIFEST_WORKSPACE } from "./run-detail-chunk-manifest-workspace";

/** TB-2371 — run detail deferred chunk catalog (subset used by manifest import tests). */
export const RUN_DETAIL_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  ...RUN_DETAIL_CHUNK_MANIFEST_WORKSPACE,
  ...RUN_DETAIL_CHUNK_MANIFEST_CREATE_HOME,
  ...RUN_DETAIL_CHUNK_MANIFEST_FINDINGS_GOVERNANCE,
  ...RUN_DETAIL_CHUNK_MANIFEST_EXPORTS_SPONSOR,
] as const;

export {
  RUN_DETAIL_CHUNK_MANIFEST_CREATE_HOME,
  RUN_DETAIL_CHUNK_MANIFEST_EXPORTS_SPONSOR,
  RUN_DETAIL_CHUNK_MANIFEST_FINDINGS_GOVERNANCE,
  RUN_DETAIL_CHUNK_MANIFEST_WORKSPACE,
};
