import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — sealed records list deferred chunk catalog. */
export const SIGNED_RECORDS_LIST_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "signed-records-list-client",
    label: "Loading Finalized review records list",
    variant: "section",
    modulePath: "@/app/(operator)/governance/sealed-records/_sections/SignedRecordsListClient",
    exportName: "default",
  },
  {
    id: "signed-records-list-table",
    label: "Loading Finalized review records table",
    variant: "section",
    modulePath: "@/app/(operator)/governance/sealed-records/_sections/SignedRecordsListTable",
    exportName: "SignedRecordsListTable",
  },
] as const;
